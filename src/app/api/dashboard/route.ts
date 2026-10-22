import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMasteryStats } from "@/lib/services/mastery";
import type { DashboardStatsDTO } from "@/lib/types";


/** 学情统计看板（PRD 模块4）：SQL/内存聚合 总答题数、正确率、薄弱知识点排行、趋势与掌握度分布 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { gradeLevel: true } });
  if (!user) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const [submissions, errorBooks, masteryStats] = await Promise.all([
    prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        isCorrect: true,
        createdAt: true,
        question: { select: { nodeId: true, node: { select: { title: true, chapter: true } } } },
      },
    }),
    prisma.errorBook.findMany({
      where: { userId },
      select: { nodeId: true, errorCount: true, isResolved: true, nextReviewDate: true },
    }),
    getMasteryStats(userId, { grade: user.gradeLevel }),
  ]);

  const total = submissions.length;
  const correctCount = submissions.filter((s) => s.isCorrect).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingReviewCount = errorBooks.filter(
    (e) => !e.isResolved && e.nextReviewDate.getTime() <= today.getTime(),
  ).length;

  // 薄弱知识点 Top5：按累计做错次数倒序（errorCount 汇总）
  const nodeMeta = new Map(masteryStats.map((m) => [m.nodeId, m]));
  const errorByNode = new Map<string, number>();
  for (const e of errorBooks) {
    errorByNode.set(e.nodeId, (errorByNode.get(e.nodeId) ?? 0) + e.errorCount);
  }
  const weakNodes = [...errorByNode.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nodeId, errorCount]) => {
      const meta = nodeMeta.get(nodeId);
      return {
        nodeId,
        title: meta?.title ?? nodeId,
        chapter: meta?.chapter ?? "",
        errorCount,
        accuracy: meta?.accuracy ?? 0,
        level: meta?.level ?? "unknown",
      };
    });

  // 章节正确率
  const chapterAgg = new Map<string, { total: number; correct: number }>();
  for (const s of submissions) {
    const key = s.question.node.chapter;
    const agg = chapterAgg.get(key) ?? { total: 0, correct: 0 };
    agg.total += 1;
    if (s.isCorrect) agg.correct += 1;
    chapterAgg.set(key, agg);
  }
  const chapterStats = [...chapterAgg.entries()].map(([chapter, agg]) => ({
    chapter,
    total: agg.total,
    correct: agg.correct,
    accuracy: agg.total === 0 ? 0 : agg.correct / agg.total,
  }));

  // 近 14 天答题趋势（无答题记录的日期补零）
  const dailyMap = new Map<string, { total: number; correct: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().slice(0, 10), { total: 0, correct: 0 });
  }
  for (const s of submissions) {
    const key = s.createdAt.toISOString().slice(0, 10);
    const agg = dailyMap.get(key);
    if (agg) {
      agg.total += 1;
      if (s.isCorrect) agg.correct += 1;
    }
  }
  const dailyStats = [...dailyMap.entries()].map(([date, agg]) => ({
    date,
    total: agg.total,
    correct: agg.correct,
    accuracy: agg.total === 0 ? 0 : agg.correct / agg.total,
  }));

  const masteryOverview = {
    weak: masteryStats.filter((m) => m.level === "weak").length,
    consolidating: masteryStats.filter((m) => m.level === "consolidating").length,
    mastered: masteryStats.filter((m) => m.level === "mastered").length,
    unknown: masteryStats.filter((m) => m.level === "unknown").length,
  };

  const dto: DashboardStatsDTO = {
    totalSubmissions: total,
    correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    resolvedCount: errorBooks.filter((e) => e.isResolved).length,
    pendingReviewCount,
    weakNodes,
    chapterStats,
    dailyStats,
    masteryOverview,
  };
  return NextResponse.json(dto);
}
