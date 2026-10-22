"use client";

/** 首页：学生概览 + 今日复习卡片 + 薄弱点速览 + 模块入口 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MasteryBadge } from "@/components/mastery-badge";
import { RequireStudent } from "@/components/require-student";
import { gradeLabel } from "@/lib/grade";
import { useStudent } from "@/lib/student-context";
import type { DashboardStatsDTO, MasteryNodeStatDTO } from "@/lib/types";

const MODULES = [
  { href: "/assessment", title: "摸底测评", desc: "全面诊断各知识点掌握情况，生成红黄绿报告", emoji: "🧭" },
  { href: "/practice", title: "专项训练", desc: "按年级、章节、知识点自由选题刷题，即时解析", emoji: "✏️" },
  { href: "/mistakes", title: "错题本", desc: "错题自动归档，按知识点分类，一键专项提升", emoji: "📕" },
  { href: "/dashboard", title: "学情看板", desc: "正确率趋势、薄弱知识点排行、掌握度图谱", emoji: "📊" },
];

export default function HomePage() {
  const { current, students } = useStudent();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [mastery, setMastery] = useState<MasteryNodeStatDTO[] | null>(null);

  const ready = students !== null;

  useEffect(() => {
    if (!current) return;
    const params = new URLSearchParams({ userId: current.id, grade: String(current.gradeLevel) });
    void fetch(`/api/dashboard?userId=${current.id}`)
      .then((r) => r.json())
      .then(setStats);
    void fetch(`/api/mastery?${params}`)
      .then((r) => r.json())
      .then((d) => setMastery(d.stats));
  }, [current]);

  if (!ready) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  const weakNodes = (mastery ?? []).filter((m) => m.level === "weak" && m.total > 0).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 欢迎区 */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wide">
            {current.name}，欢迎回来
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {gradeLabel(current.gradeLevel)} · 数学 · 今日目标是消灭 {stats?.pendingReviewCount ?? 0} 道到期错题
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/assessment">尚未摸底？先做入学测评 →</Link>
        </Button>
      </section>

      {/* 数据速览 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "累计答题", value: stats ? String(stats.totalSubmissions) : "—", unit: "题" },
          {
            label: "总体正确率",
            value: stats ? `${Math.round(stats.accuracy * 100)}` : "—",
            unit: "%",
          },
          { label: "待复习错题", value: stats ? String(stats.pendingReviewCount) : "—", unit: "题" },
          { label: "已通关错题", value: stats ? String(stats.resolvedCount) : "—", unit: "题" },
        ].map((item) => (
          <Card key={item.label} className="border-border/80">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                {item.value}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">{item.unit}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 今日复习 + 薄弱点速览 */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-mastery-mid/35 bg-gradient-to-br from-card to-accent/40">
          <CardHeader>
            <CardTitle className="font-display">今日复习</CardTitle>
            <CardDescription>按艾宾浩斯节奏（第 1 / 3 / 7 天）自动安排</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            {stats === null ? (
              <Skeleton className="h-9 w-40" />
            ) : (
              <>
                <p className="font-display text-3xl font-bold tabular-nums">
                  {stats.pendingReviewCount}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">题到期</span>
                </p>
                <Button asChild={stats.pendingReviewCount > 0} disabled={stats.pendingReviewCount === 0}>
                  {stats.pendingReviewCount > 0 ? (
                    <Link href="/review">开始复习 →</Link>
                  ) : (
                    "今日已完成 ✓"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">薄弱点速览</CardTitle>
            <CardDescription>本年级 · 红色知识点优先攻克</CardDescription>
          </CardHeader>
          <CardContent>
            {mastery === null ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : weakNodes.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                暂无明显薄弱知识点。可先做一次<Link href="/assessment" className="text-primary underline-offset-2 hover:underline">摸底测评</Link>建立诊断基线。
              </p>
            ) : (
              <ul className="space-y-2.5">
                {weakNodes.map((node) => (
                  <li key={node.nodeId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{node.title}</p>
                      <p className="text-xs text-muted-foreground">
                        近 5 题正确率 {Math.round(node.accuracy * 100)}%
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <MasteryBadge level={node.level} />
                      <Button asChild size="xs" variant="outline">
                        <Link href={`/practice/reinforce?nodeId=${node.nodeId}`}>专项提升</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 模块入口 */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m) => (
          <Link key={m.href} href={m.href} className="group">
            <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
              <CardContent className="pt-5">
                <p className="text-2xl">{m.emoji}</p>
                <p className="mt-2 font-display text-base font-bold group-hover:text-primary">{m.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
