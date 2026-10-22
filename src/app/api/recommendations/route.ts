import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Dimension, QuestionDTO } from "@/lib/types";


/**
 * 规则化变式巩固推荐（PRD 3.2）
 * GET ?userId=&nodeId=&difficulty=&count=5
 * 规则：同知识点、同难度优先（不足时按 ±1 难度扩展）、排除该学生已做过的题。
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId");
  const nodeId = params.get("nodeId");
  const difficulty = Number(params.get("difficulty") ?? 2);
  const count = Math.min(10, Number(params.get("count") ?? 5) || 5);

  if (!userId || !nodeId) {
    return NextResponse.json({ error: "缺少 userId 或 nodeId" }, { status: 400 });
  }

  const doneQuestions = await prisma.submission.findMany({
    where: { userId },
    select: { questionId: true },
  });
  const doneIds = [...new Set(doneQuestions.map((d) => d.questionId))];

  const pick = async (difficulties: number[], take: number) => {
    const pool = await prisma.question.findMany({
      where: { nodeId, difficulty: { in: difficulties }, id: { notIn: doneIds } },
      select: { id: true, nodeId: true, type: true, content: true, options: true, difficulty: true, dimension: true },
    });
    // 随机洗牌后取前 take 道，保证每次推荐的变式组合有变化
    return pool.sort(() => Math.random() - 0.5).slice(0, take);
  };

  const difficulties = Number.isInteger(difficulty) ? difficulty : 2;
  let questions = await pick([difficulties], count);
  if (questions.length < count) {
    const expansion = [difficulties - 1, difficulties + 1].filter((d) => d >= 1 && d <= 3);
    const extra = await pick(expansion, count - questions.length);
    questions = [...questions, ...extra];
  }
  // 同难度与扩展难度都不足时，回退到已做过的同知识点题（去重）
  if (questions.length < count) {
    const excludeIds = [...doneIds, ...questions.map((q) => q.id)];
    const fallback = await prisma.question.findMany({
      where: { nodeId, id: { notIn: excludeIds } },
      take: count - questions.length,
      select: { id: true, nodeId: true, type: true, content: true, options: true, difficulty: true, dimension: true },
    });
    questions = [...questions, ...fallback];
  }

  const dto: QuestionDTO[] = questions.map((q) => ({
    id: q.id,
    nodeId: q.nodeId,
    type: q.type === "fill_in" ? "fill_in" : "single_choice",
    content: q.content,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
    difficulty: (Math.min(3, Math.max(1, q.difficulty)) as 1 | 2 | 3),
    dimension: (["concept", "logic", "calc", "application"].includes(q.dimension) ? q.dimension : "concept") as Dimension,
  }));

  return NextResponse.json({ questions: dto, allDone: doneIds.length > 0 && dto.length === 0 });
}
