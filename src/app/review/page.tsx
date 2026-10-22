"use client";

/** 今日复习：FSRS-5 到期错题重做；作答后自评回忆质量（重来/困难/良好/简单） */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionRunner, type RunnerQuestion } from "@/components/question-runner";
import { RequireStudent } from "@/components/require-student";
import { useStudent } from "@/lib/student-context";
import type { ErrorBookItemDTO } from "@/lib/types";

export default function ReviewPage() {
  const { current, students } = useStudent();
  const [items, setItems] = useState<ErrorBookItemDTO[] | null>(null);

  const load = useCallback(() => {
    if (!current) return;
    void fetch(`/api/review?userId=${current.id}&scope=due`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [current]);

  useEffect(load, [load]);

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  const questions: RunnerQuestion[] = (items ?? []).map((item) => ({
    id: item.questionId,
    nodeId: item.nodeId,
    type: item.type,
    content: item.content,
    options: item.options,
    difficulty: item.difficulty,
    dimension: "concept",
    nodeTitle: item.nodeTitle,
    chapter: item.chapter,
  }));

  const questionMeta: Record<string, string> = {};
  for (const item of items ?? []) {
    questionMeta[item.questionId] = `第 ${item.reps + 1} 次复习 · 当前可检索性 ${Math.round(item.retrievability * 100)}%`;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">今日复习</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          FSRS-5 记忆引擎：可检索性衰减到阈值时自动到期；作答后自评回忆质量，算法动态拟合你的记忆曲线（目标保留率 90%）
        </p>
      </div>

      {items === null ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card className="grid-paper worksheet-edge">
          <CardContent className="py-12 text-center">
            <p className="font-display text-lg font-bold">现在没有到期的复习任务 🎉</p>
            <p className="mt-2 text-sm text-muted-foreground">
              错题会在记忆临界点自动出现在这里——不是每天固定刷，而是「快忘了才复习」，这正是 FSRS 高效的地方。
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild variant="outline" size="sm"><Link href="/practice">去专项训练</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/mistakes">查看错题本</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <QuestionRunner
          key={items.length}
          questions={questions}
          mode="practice"
          enableRating
          questionMeta={questionMeta}
          summaryExtra={
            <div className="flex justify-center gap-2">
              <Button asChild variant="outline" size="sm"><Link href="/">返回首页</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/dashboard">查看学情看板</Link></Button>
            </div>
          }
        />
      )}
    </div>
  );
}
