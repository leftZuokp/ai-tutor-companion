import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { KnowledgeCard, KnowledgeNodeDTO } from "@/lib/types";


/** 知识点树：?grade=7&subject=math（不传则返回全部），含前置依赖/思想方法/知识卡片 */
export async function GET(request: NextRequest) {
  const gradeParam = request.nextUrl.searchParams.get("grade");
  const subject = request.nextUrl.searchParams.get("subject") ?? undefined;
  const grade = gradeParam ? Number(gradeParam) : undefined;

  const nodes = await prisma.knowledgeNode.findMany({
    where: {
      ...(subject ? { subject } : {}),
      ...(grade && Number.isInteger(grade) ? { grade } : {}),
    },
    orderBy: [{ grade: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      title: true,
      subject: true,
      grade: true,
      chapter: true,
      sortOrder: true,
      prerequisites: true,
      thinkingMethods: true,
      card: true,
      _count: { select: { questions: true } },
    },
  });

  const dto: KnowledgeNodeDTO[] = nodes.map(({ _count, prerequisites, thinkingMethods, card, ...n }) => ({
    ...n,
    questionCount: _count.questions,
    prerequisites: prerequisites ? (JSON.parse(prerequisites) as string[]) : null,
    thinkingMethods: thinkingMethods ? (JSON.parse(thinkingMethods) as string[]) : null,
    card: card ? (JSON.parse(card) as KnowledgeCard) : null,
  }));
  return NextResponse.json(dto);
}
