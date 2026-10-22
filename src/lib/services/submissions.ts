/**
 * 答题提交服务：判题 → 写答题记录 → 维护错题本（含艾宾浩斯复习计划推进）
 * 被专项训练 / 变式巩固 / 今日复习 / 摸底测评 交卷统一复用。
 */
import type { Question } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { gradeAnswer } from "@/lib/rules/grading";
import { scheduleAfterSuccess, scheduleForNewFailure } from "@/lib/rules/review";

export interface AnswerInput {
  questionId: string;
  userAnswer: string;
}

export interface GradedResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answer: string;
  explanation: string;
  /** 答对后错题复习阶段是否推进/通关（用于前端提示） */
  reviewAdvanced: boolean;
}

export async function gradeAndSaveAnswers(
  userId: string,
  answers: AnswerInput[],
): Promise<GradedResult[]> {
  if (answers.length === 0) return [];

  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const questionMap = new Map<string, Question>(questions.map((q) => [q.id, q]));

  const results: GradedResult[] = [];

  for (const { questionId, userAnswer } of answers) {
    const question = questionMap.get(questionId);
    if (!question) continue; // 非法题目 ID 直接忽略

    const isCorrect = gradeAnswer(question, userAnswer);

    await prisma.submission.create({
      data: { userId, questionId, userAnswer, isCorrect },
    });

    const reviewAdvanced = await maintainErrorBook(userId, question, isCorrect);

    results.push({
      questionId,
      userAnswer,
      isCorrect,
      answer: question.answer,
      explanation: question.explanation,
      reviewAdvanced,
    });
  }

  return results;
}

/** 维护错题本：做错收录/重置，做对推进复习阶段。返回是否推进了复习计划。 */
async function maintainErrorBook(userId: string, question: Question, isCorrect: boolean): Promise<boolean> {
  const existing = await prisma.errorBook.findUnique({
    where: { userId_questionId: { userId, questionId: question.id } },
  });

  if (!isCorrect) {
    // 做错：新增或重置错题
    const plan = scheduleForNewFailure();
    if (existing) {
      await prisma.errorBook.update({
        where: { id: existing.id },
        data: {
          errorCount: { increment: 1 },
          lastFailedAt: new Date(),
          ...plan, // 含 isResolved: false 及重置后的复习计划
        },
      });
    } else {
      await prisma.errorBook.create({
        data: {
          userId,
          questionId: question.id,
          nodeId: question.nodeId,
          errorCount: 1,
          ...plan,
        },
      });
    }
    return false;
  }

  // 答对：若存在未通关错题，推进艾宾浩斯阶段
  if (existing && !existing.isResolved) {
    const plan = scheduleAfterSuccess(existing.reviewStage);
    await prisma.errorBook.update({
      where: { id: existing.id },
      data: plan,
    });
    return true;
  }
  return false;
}
