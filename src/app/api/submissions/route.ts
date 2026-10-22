import { NextRequest, NextResponse } from "next/server";
import { gradeAndSaveAnswers, type AnswerInput } from "@/lib/services/submissions";


/**
 * 提交答题：{ userId, answers: [{ questionId, userAnswer, rating? }] }
 * 判题 → 写答题记录 → 自动维护错题本与 FSRS-5 记忆调度，返回判题结果、分步提示与解析。
 * rating（1-4 复习自评）可选：答错强制按"重来"调度，答对时默认"良好"。
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const answers: AnswerInput[] = Array.isArray(body?.answers)
    ? body.answers
        .filter(
          (a: unknown): a is AnswerInput =>
            !!a && typeof (a as AnswerInput).questionId === "string" && typeof (a as AnswerInput).userAnswer === "string",
        )
        .map((a: AnswerInput) => ({
          questionId: a.questionId,
          userAnswer: a.userAnswer,
          ...(a.rating !== undefined ? { rating: Number(a.rating) } : {}),
        }))
    : [];

  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  if (answers.length === 0) return NextResponse.json({ error: "answers 不能为空" }, { status: 400 });

  const results = await gradeAndSaveAnswers(userId, answers);
  return NextResponse.json({ results });
}
