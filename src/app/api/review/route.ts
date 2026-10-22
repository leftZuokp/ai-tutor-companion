import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ErrorBookItemDTO } from "@/lib/types";


/**
 * 错题本查询：GET ?userId=&scope=due|all
 * - all：全部错题（错题本页面）
 * - due：今天到期需要复习的错题（首页"今日复习"卡片）
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId");
  const scope = params.get("scope") ?? "all";

  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items = await prisma.errorBook.findMany({
    where: {
      userId,
      ...(scope === "due" ? { isResolved: false, nextReviewDate: { lte: today } } : {}),
    },
    orderBy: { nextReviewDate: "asc" },
    select: {
      id: true,
      questionId: true,
      nodeId: true,
      errorCount: true,
      isResolved: true,
      reviewStage: true,
      nextReviewDate: true,
      lastFailedAt: true,
      node: { select: { title: true, chapter: true } },
      question: { select: { content: true, options: true, type: true, difficulty: true } },
    },
  });

  const dto: ErrorBookItemDTO[] = items.map((item) => ({
    id: item.id,
    questionId: item.questionId,
    nodeId: item.nodeId,
    nodeTitle: item.node.title,
    chapter: item.node.chapter,
    content: item.question.content,
    options: item.question.options ? (JSON.parse(item.question.options) as string[]) : null,
    type: item.question.type === "fill_in" ? "fill_in" : "single_choice",
    difficulty: (Math.min(3, Math.max(1, item.question.difficulty)) as 1 | 2 | 3),
    errorCount: item.errorCount,
    isResolved: item.isResolved,
    reviewStage: item.reviewStage,
    nextReviewDate: item.nextReviewDate.toISOString(),
    lastFailedAt: item.lastFailedAt.toISOString(),
  }));

  return NextResponse.json({ items: dto });
}
