import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * 摸底测评组卷（闭环起点）：
 * POST { userId, grade, subject }
 * 规则：覆盖该年级该学科的全部知识点，每知识点抽 2~4 题（优先未做过、中等难度）。
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
        select: { id: true, type: true, content: true, options: true, difficulty: true },
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
  const questions: Array<{
    id: string;
    nodeId: string;
    nodeTitle: string;
    chapter: string;
    type: "single_choice" | "fill_in";
    content: string;
    options: string[] | null;
    difficulty: 1 | 2 | 3;
  }> = [];

  for (const node of nodes) {
    const unseen = node.questions.filter((q) => !doneIds.has(q.id));
    const pool = unseen.length > 0 ? unseen : node.questions;
    // 中等难度优先，其次易/难，保证诊断区分度
    const byPriority = [...pool].sort((a, b) => Math.abs(a.difficulty - 2) - Math.abs(b.difficulty - 2));
    const picked = byPriority
      .sort(() => Math.random() - 0.5)
      .slice(0, perNode)
      .sort((a, b) => Math.abs(a.difficulty - 2) - Math.abs(b.difficulty - 2));

    for (const q of picked) {
      questions.push({
        id: q.id,
        nodeId: node.id,
        nodeTitle: node.title,
        chapter: node.chapter,
        type: q.type === "fill_in" ? "fill_in" : "single_choice",
        content: q.content,
        options: q.options ? (JSON.parse(q.options) as string[]) : null,
        difficulty: (Math.min(3, Math.max(1, q.difficulty)) as 1 | 2 | 3),
      });
    }
  }

  return NextResponse.json({
    grade,
    subject,
    nodeCount: nodes.length,
    questions,
  });
}
