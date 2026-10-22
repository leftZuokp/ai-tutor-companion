import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { KnowledgeNodeDTO } from "@/lib/types";


/** 知识点树：?grade=7&subject=math（不传则返回全部） */
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
      _count: { select: { questions: true } },
    },
  });

  const dto: KnowledgeNodeDTO[] = nodes.map(({ _count, ...n }) => ({
    ...n,
    questionCount: _count.questions,
  }));
  return NextResponse.json(dto);
}
