import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Dimension, QuestionType } from "@/lib/types";


/**
 * 摸底测评组卷（闭环起点，PRD 3.1）：
 * POST { userId, grade, subject }
 * 规则：
 * 1. 覆盖该年级该学科的全部知识点，每知识点抽 2~4 题（优先未做过、中等难度）；
 * 2. 四能力维度（概念理解/逻辑推演/运算准确/综合应用）均衡覆盖，支撑诊断报告的多维得分。
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const grade = Number(body?.grade);
  const subject = typeof body?.subject === "string" ? body.subject : "math";

  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    return NextResponse.json({ error: "年级必须为 1-12 的整数" }, { status: 400 });
  }

  const nodes = await prisma.knowledgeNode.findMany({
    where: { grade, subject },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      chapter: true,
      questions: {
        select: { id: true, type: true, content: true, options: true, difficulty: true, dimension: true },
      },
    },
  });
  if (nodes.length === 0) {
    return NextResponse.json({ error: "该年级暂无题库内容" }, { status: 404 });
  }

  const done = await prisma.submission.findMany({
    where: { userId },
    select: { questionId: true },
  });
  const doneIds = new Set(done.map((d) => d.questionId));

  const perNode = Math.min(4, Math.max(2, Math.ceil(12 / nodes.length)));
  const dimCount: Record<string, number> = { concept: 0, logic: 0, calc: 0, application: 0 };
  const questions: Array<{
    id: string;
    nodeId: string;
    nodeTitle: string;
    chapter: string;
    type: QuestionType;
    content: string;
    options: string[] | null;
    difficulty: 1 | 2 | 3;
    dimension: Dimension;
  }> = [];

  for (const node of nodes) {
    const unseen = node.questions.filter((q) => !doneIds.has(q.id));
    const pool = unseen.length > 0 ? unseen : node.questions;

    // 排序主键：填补维度缺口（保证诊断卷四维覆盖），次键：难度接近中等（保证区分度）
    const dimensionOf = (q: (typeof pool)[number]): Dimension =>
      (["concept", "logic", "calc", "application"].includes(q.dimension) ? q.dimension : "concept") as Dimension;
    const deficit = (dim: Dimension) => 3 - (dimCount[dim] ?? 0);

    const picked = [...pool]
      .sort(
        (a, b) =>
          deficit(dimensionOf(b)) - deficit(dimensionOf(a)) ||
          Math.abs(a.difficulty - 2) - Math.abs(b.difficulty - 2),
      )
      .slice(0, perNode);

    for (const q of picked) {
      const dimension = dimensionOf(q);
      dimCount[dimension] += 1;
      questions.push({
        id: q.id,
        nodeId: node.id,
        nodeTitle: node.title,
        chapter: node.chapter,
        type: (q.type === "fill_in" ? "fill_in" : "single_choice") as QuestionType,
        content: q.content,
        options: q.options ? (JSON.parse(q.options) as string[]) : null,
        difficulty: (Math.min(3, Math.max(1, q.difficulty)) as 1 | 2 | 3),
        dimension,
      });
    }
  }

  return NextResponse.json({ grade, subject, nodeCount: nodes.length, questions });
}
