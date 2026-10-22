import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Dimension, QuestionDTO, QuestionType } from "@/lib/types";


function toDTO(q: {
  id: string;
  nodeId: string;
  type: string;
  content: string;
  options: string | null;
  difficulty: number;
  dimension: string;
}): QuestionDTO {
  return {
    id: q.id,
    nodeId: q.nodeId,
    type: (q.type === "fill_in" ? "fill_in" : "single_choice") as QuestionType,
    content: q.content,
    options: q.options ? (JSON.parse(q.options) as string[]) : null,
    difficulty: (Math.min(3, Math.max(1, q.difficulty)) as 1 | 2 | 3),
    dimension: (["concept", "logic", "calc", "application"].includes(q.dimension)
      ? q.dimension
      : "concept") as Dimension,
  };
}

/** 专项训练题目列表：?nodeId=&difficulty=&dimension=&type=&limit=（答案/解析/提示不下发） */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const nodeId = params.get("nodeId");
  if (!nodeId) return NextResponse.json({ error: "缺少 nodeId" }, { status: 400 });

  const difficulty = params.get("difficulty");
  const dimension = params.get("dimension");
  const type = params.get("type");
  const limit = Math.min(50, Number(params.get("limit") ?? 20) || 20);

  const questions = await prisma.question.findMany({
    where: {
      nodeId,
      ...(difficulty && Number.isInteger(Number(difficulty)) ? { difficulty: Number(difficulty) } : {}),
      ...(dimension ? { dimension } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: [{ difficulty: "asc" }, { sortOrder: "asc" }],
    take: limit,
    select: { id: true, nodeId: true, type: true, content: true, options: true, difficulty: true, dimension: true },
  });

  return NextResponse.json(questions.map(toDTO));
}
