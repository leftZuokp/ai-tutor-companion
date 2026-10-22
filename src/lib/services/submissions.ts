/**
 * 答题提交服务：判题 → 写答题记录 → 维护错题本（FSRS-5 记忆调度）→ 写复习日志
 * 被专项训练 / 变式巩固 / 今日复习 / 摸底测评 交卷统一复用。
 */
import type { Question } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isResolvedState,
  newCardState,
  parseState,
  scheduleReview,
  type ReviewRating,
} from "@/lib/rules/fsrs";
import { gradeAnswer } from "@/lib/rules/grading";

export interface AnswerInput {
  questionId: string;
  userAnswer: string;
  /** 复习自评 1-4（重来/困难/良好/简单）；答错时强制按"重来"调度 */
  rating?: number;
}

export interface GradedResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answer: string;
  explanation: string;
  /** 三级分步提示（条件梳理 / 方法联想），答错后前端逐步揭示 */
  hints: string[] | null;
  /** 本次作答后错题的记忆调度摘要（"错题已入本"或"下次约 X 天后复习"） */
  reviewNote: string;
}

const clampRating = (value: number | undefined, fallback: ReviewRating): ReviewRating => {
  const n = Number(value);
  return n >= 1 && n <= 4 ? (n as ReviewRating) : fallback;
};

export async function gradeAndSaveAnswers(
  userId: string,
  answers: AnswerInput[],
): Promise<GradedResult[]> {
  if (answers.length === 0) return [];

  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const questionMap = new Map<string, Question>(questions.map((q) => [q.id, q]));

  const results: GradedResult[] = [];

  for (const { questionId, userAnswer, rating } of answers) {
    const question = questionMap.get(questionId);
    if (!question) continue; // 非法题目 ID 直接忽略

    const isCorrect = gradeAnswer(question, userAnswer);

    await prisma.submission.create({
      data: { userId, questionId, userAnswer, isCorrect },
    });

    const { note } = await maintainErrorBook(userId, question, isCorrect, rating);

    results.push({
      questionId,
      userAnswer,
      isCorrect,
      answer: question.answer,
      explanation: question.explanation,
      hints: question.hints ? (JSON.parse(question.hints) as string[]) : null,
      reviewNote: note,
    });
  }

  return results;
}

/**
 * 维护错题本与 FSRS 记忆状态：
 * - 做错：新卡入本或既有卡重置，一律按"重来"调度并记日志
 * - 答对：若存在未通关错题，按自评（默认"良好"）推进调度并记日志
 * 返回前端展示用的调度摘要。
 */
async function maintainErrorBook(
  userId: string,
  question: Question,
  isCorrect: boolean,
  rating?: number,
): Promise<{ note: string }> {
  const existing = await prisma.errorBook.findUnique({
    where: { userId_questionId: { userId, questionId: question.id } },
  });

  if (!isCorrect) {
    const prevState = parseState(existing?.fsrsState);
    const state = scheduleReview(prevState, 1);
    const data = {
      errorCount: { increment: 1 },
      lastFailedAt: new Date(),
      isResolved: false,
      due: new Date(state.due),
      fsrsState: JSON.stringify(state),
    };
    let bookId: string;
    if (existing) {
      await prisma.errorBook.update({ where: { id: existing.id }, data });
      bookId = existing.id;
    } else {
      const created = await prisma.errorBook.create({
        data: {
          userId,
          questionId: question.id,
          nodeId: question.nodeId,
          due: new Date(state.due),
          fsrsState: JSON.stringify(state),
          ...{ errorCount: 1 },
        },
      });
      bookId = created.id;
    }
    await writeLog(bookId, 1, state);
    return { note: "已收入错题本，FSRS 已安排最近一次复习。" };
  }

  if (existing && !existing.isResolved) {
    const prevState = parseState(existing.fsrsState) ?? newCardState();
    const effective = clampRating(rating, 3);
    const state = scheduleReview(prevState, effective);
    const resolved = isResolvedState(state);
    await prisma.errorBook.update({
      where: { id: existing.id },
      data: {
        isResolved: resolved,
        due: new Date(state.due),
        fsrsState: JSON.stringify(state),
      },
    });
    await writeLog(existing.id, effective, state);
    if (resolved) {
      return { note: "太棒了，记忆间隔已拉长到 21 天以上，这道错题通关！" };
    }
    return { note: `复习反馈已记录，下次约 ${state.scheduledDays} 天后（${state.due.slice(0, 10)}）复习。` };
  }
  return { note: "" };
}

async function writeLog(errorBookId: string, rating: ReviewRating, state: ReturnType<typeof scheduleReview>) {
  await prisma.fsrsLog.create({
    data: {
      errorBookId,
      rating,
      state: JSON.stringify(state),
      stability: state.stability,
      difficulty: state.difficulty,
    },
  });
}
