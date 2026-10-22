"use client";

/** 学情统计看板：正确率趋势 / 章节正确率 / 薄弱知识点排行 / 掌握度图谱 */
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MasteryBadge, MasteryDot } from "@/components/mastery-badge";
import { RequireStudent } from "@/components/require-student";
import { gradeLabel } from "@/lib/grade";
import { useStudent } from "@/lib/student-context";
import type { DashboardStatsDTO, MasteryNodeStatDTO } from "@/lib/types";

const INK = "#3d5a94"; // 墨蓝
const VERMILION = "#b6432e"; // 朱砂
const JADE = "#2f7d4f"; // 青玉

export default function DashboardPage() {
  const { current, students } = useStudent();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [mastery, setMastery] = useState<MasteryNodeStatDTO[] | null>(null);

  useEffect(() => {
    if (!current) return;
    const masteryParams = new URLSearchParams({ userId: current.id, grade: String(current.gradeLevel), subject: "math" });
    void fetch(`/api/dashboard?userId=${current.id}`).then((r) => r.json()).then(setStats);
    void fetch(`/api/mastery?${masteryParams}`).then((r) => r.json()).then((d) => setMastery(d.stats));
  }, [current]);

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  const daily = (stats?.dailyStats ?? []).map((d) => ({
    ...d,
    date: d.date.slice(5).replace("-", "/"),
    accuracyPct: Math.round(d.accuracy * 100),
  }));
  const chapters = (stats?.chapterStats ?? []).map((c) => ({
    ...c,
    short: c.chapter.replace(/^第[^\s]*章\s*/, ""),
    accuracyPct: Math.round(c.accuracy * 100),
  }));

  const overview = stats?.masteryOverview;
  const byChapter = new Map<string, MasteryNodeStatDTO[]>();
  for (const m of mastery ?? []) {
    const list = byChapter.get(m.chapter) ?? [];
    list.push(m);
    byChapter.set(m.chapter, list);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">学情看板</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {current.name} · {gradeLabel(current.gradeLevel)} · 数学
        </p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "总答题数", value: stats ? String(stats.totalSubmissions) : "—", unit: "题" },
          { label: "总体正确率", value: stats ? `${Math.round(stats.accuracy * 100)}` : "—", unit: "%" },
          { label: "待复习", value: stats ? String(stats.pendingReviewCount) : "—", unit: "题" },
          { label: "错题通关", value: stats ? String(stats.resolvedCount) : "—", unit: "题" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {item.value}<span className="ml-0.5 text-xs font-normal text-muted-foreground">{item.unit}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 近14天趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">近 14 天答题趋势</CardTitle>
            <CardDescription>柱：答题数；折线：正确率（%）</CardDescription>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5decf" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8a8273" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#8a8273" }} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#8a8273" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5decf", background: "#fdfbf7", fontSize: 12 }}
                    formatter={(value, name) => (name === "正确率" ? [`${value}%`, name] : [value, name])}
                  />
                  <Bar yAxisId="left" dataKey="total" name="答题数" fill={INK} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" dataKey="accuracyPct" name="正确率" stroke={VERMILION} strokeWidth={2} dot={{ r: 2.5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 章节正确率 */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">各章节正确率</CardTitle>
            <CardDescription>按章节聚合的历史答题正确率（%）</CardDescription>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <Skeleton className="h-60 w-full" />
            ) : chapters.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">暂无答题数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chapters} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5decf" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#8a8273" }} />
                  <YAxis type="category" dataKey="short" width={92} tick={{ fontSize: 11, fill: "#4a453b" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5decf", background: "#fdfbf7", fontSize: 12 }}
                    formatter={(value) => [`${value}%`, "正确率"]}
                  />
                  <Bar dataKey="accuracyPct" radius={[0, 3, 3, 0]}>
                    {chapters.map((c) => (
                      <Cell key={c.chapter} fill={c.accuracyPct >= 80 ? JADE : c.accuracyPct >= 60 ? "#c2880b" : VERMILION} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 薄弱知识点排行 */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">薄弱知识点 Top 5</CardTitle>
            <CardDescription>按累计做错次数排序</CardDescription>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : stats.weakNodes.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">暂无错题记录，很棒！</p>
            ) : (
              <ol className="space-y-2.5">
                {stats.weakNodes.map((node, i) => (
                  <li key={node.nodeId} className="flex items-center gap-3">
                    <span className="font-display w-5 text-center text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{node.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {node.chapter} · 错 {node.errorCount} 次 · 正确率 {Math.round(node.accuracy * 100)}%
                      </p>
                    </div>
                    <MasteryBadge level={node.level} />
                    <Button asChild size="xs" variant="outline">
                      <Link href={`/practice/reinforce?nodeId=${node.nodeId}`}>提升</Link>
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* 掌握度图谱 */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">知识图谱 · 掌握度分布</CardTitle>
            <CardDescription>
              {overview ? `已掌握 ${overview.mastered} · 巩固中 ${overview.consolidating} · 未掌握 ${overview.weak} · 未接触 ${overview.unknown}` : "…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mastery === null ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-2/3" /></div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {[...byChapter.entries()].map(([chapter, list]) => (
                  <div key={chapter}>
                    <p className="text-xs font-medium text-muted-foreground">{chapter}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
                      {list.map((m) => (
                        <span key={m.nodeId} className="flex items-center gap-1.5 text-sm">
                          <MasteryDot level={m.level} />
                          {m.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
