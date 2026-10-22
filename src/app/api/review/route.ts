import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseState, retrievability } from "@/lib/rules/fsrs";

/**
 * 错题本查询：GET ?userId=&scope=due|all
 * - all：全部错题（错题本页面）
 * - due：FSRS 到期的错题（首页"今日复习"卡片）
 * 返回含可检索性（当前回忆成功率）与下次复习调度信息。
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId");
  const scope = params.get("scope") ?? "all";

  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

  const items = await prisma.errorBook.findMany({
    where: { userId, ...(scope === "due" ? { isResolved: false } : {}) },
    orderBy: { due: "asc" },
    select: {
      id: true,
      questionId: true,
      nodeId: true,
      errorCount: true,
      isResolved: true,
      attribution: true,
      due: true,
      fsrsState: true,
      lastFailedAt: true,
      node: { select: { title: true, chapter: true } },
      question: { select: { content: true, options: true, type: true, difficulty: true } },
    },
  });

  const now = new Date();
  const dto = items
    .map((item) => {
      const state = parseState(item.fsrsState);
      return {
        id: item.id,
        questionId: item.questionId,
        nodeId: item.nodeId,
        nodeTitle: item.node.title,
        chapter: item.node.chapter,
        content: item.question.content,
        options: item.question.options ? (JSON.parse(item.question.options) as string[]) : null,
        type: item.question.type === "fill_in" ? ("fill_in" as const) : ("single_choice" as const),
        difficulty: (Math.min(3, Math.max(1, item.question.difficulty)) as 1 | 2 | 3),
        errorCount: item.errorCount,
        isResolved: item.isResolved,
        attribution: item.attribution,
        due: item.due.toISOString(),
        lastFailedAt: item.lastFailedAt.toISOString(),
        retrievability: state ? retrievability(state, now) : 0,
        scheduledDays: state?.scheduledDays ?? 0,
        reps: state?.reps ?? 0,
      };
    })
    .filter((item) => (scope === "due" ? !item.isResolved && new Date(item.due) <= now : true));

  return NextResponse.json({ items: dto });
}
