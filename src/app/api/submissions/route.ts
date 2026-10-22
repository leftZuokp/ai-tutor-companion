import { NextRequest, NextResponse } from "next/server";
import { gradeAndSaveAnswers, type AnswerInput } from "@/lib/services/submissions";


/**
 * 提交答题：{ userId, answers: [{ questionId, userAnswer }] }
 * 判题 → 写答题记录 → 自动维护错题本与艾宾浩斯复习计划，返回判题结果与解析。
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
    : [];

  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  if (answers.length === 0) return NextResponse.json({ error: "answers 不能为空" }, { status: 400 });

  const results = await gradeAndSaveAnswers(userId, answers);
  return NextResponse.json({ results });
}
