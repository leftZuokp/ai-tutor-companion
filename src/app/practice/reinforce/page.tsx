"use client";

/** 专项提升（规则化变式巩固）：同知识点、同难度（±1）、未做过的变式题 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionRunner, type RunnerQuestion } from "@/components/question-runner";
import { RequireStudent } from "@/components/require-student";
import { useStudent } from "@/lib/student-context";
import type { KnowledgeNodeDTO } from "@/lib/types";

function ReinforcePageInner() {
  const searchParams = useSearchParams();
  const nodeId = searchParams.get("nodeId");
  const { current, students } = useStudent();
  const [node, setNode] = useState<KnowledgeNodeDTO | null>(null);
  const [questions, setQuestions] = useState<RunnerQuestion[] | null>(null);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!nodeId || !current) return;
    const params = new URLSearchParams({ userId: current.id, nodeId, count: "5" });
    void fetch(`/api/recommendations?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions ?? []);
        setAllDone(Boolean(d.allDone));
      });
  }, [nodeId, current]);

  useEffect(() => {
    if (!nodeId) return;
    void fetch(`/api/knowledge`)
      .then((r) => r.json())
      .then((list: KnowledgeNodeDTO[]) => setNode(list.find((n) => n.id === nodeId) ?? null));
  }, [nodeId]);

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  if (!nodeId) {
    return (
      <Card className="mx-auto mt-16 max-w-md border-dashed">
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          缺少知识点参数，请从<Link href="/mistakes" className="text-primary underline-offset-2 hover:underline">错题本</Link>
          或<Link href="/" className="text-primary underline-offset-2 hover:underline">首页薄弱点</Link>发起专项提升。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">专项提升 · 变式巩固</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          目标知识点：<span className="font-medium text-foreground">{node?.title ?? "…"}</span>
          {node && <span className="mx-2 opacity-40">|</span>}
          {node?.chapter}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          推荐规则：同知识点、同难度优先（不足时扩展 ±1 难度），并自动排除你已做过的题目。
        </p>
      </div>

      {questions === null ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            {allDone
              ? "该知识点的题目你都已做过，可以换个知识点巩固，或到学情看板查看掌握情况。"
              : "该知识点暂无更多变式题。"}
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild variant="outline" size="sm"><Link href="/mistakes">返回错题本</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/practice">去专项训练</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <QuestionRunner
          questions={questions}
          mode="practice"
          summaryExtra={
            <div className="flex justify-center gap-2">
              <Button asChild variant="outline" size="sm"><Link href="/mistakes">返回错题本</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/dashboard">查看学情看板</Link></Button>
            </div>
          }
        />
      )}
    </div>
  );
}

export default function ReinforcePage() {
  return (
    <Suspense fallback={<Skeleton className="mt-10 h-64 w-full" />}>
      <ReinforcePageInner />
    </Suspense>
  );
}
