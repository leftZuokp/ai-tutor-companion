"use client";

/** 分级专项训练：年级 → 学科(数学) → 章节/知识点 → 逐题练习 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MasteryBadge } from "@/components/mastery-badge";
import { MathText } from "@/components/math-text";
import { QuestionRunner, type RunnerQuestion } from "@/components/question-runner";
import { RequireStudent } from "@/components/require-student";
import { gradeLabel } from "@/lib/grade";
import { useStudent } from "@/lib/student-context";
import type { KnowledgeNodeDTO, MasteryNodeStatDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PracticePage() {
  const { current, students } = useStudent();
  // 年级默认跟随学生档案，用户手动切换后以手动选择为准
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const grade = gradeOverride ?? current?.gradeLevel ?? 7;
  const [nodes, setNodes] = useState<KnowledgeNodeDTO[] | null>(null);
  const [mastery, setMastery] = useState<Record<string, MasteryNodeStatDTO>>({});
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeDTO | null>(null);
  const [questions, setQuestions] = useState<RunnerQuestion[] | null>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/knowledge?grade=${grade}&subject=math`)
      .then((r) => r.json())
      .then((list) => {
        if (!active) return;
        setNodes(list);
        setSelectedNode(null);
        setQuestions(null);
      });
    return () => {
      active = false;
    };
  }, [grade]);

  useEffect(() => {
    if (!current || nodes === null) return;
    const params = new URLSearchParams({ userId: current.id, grade: String(grade), subject: "math" });
    void fetch(`/api/mastery?${params}`)
      .then((r) => r.json())
      .then((d: { stats: MasteryNodeStatDTO[] }) => {
        const map: Record<string, MasteryNodeStatDTO> = {};
        for (const s of d.stats) map[s.nodeId] = s;
        setMastery(map);
      });
  }, [current, grade, nodes]);

  const loadQuestions = useCallback((node: KnowledgeNodeDTO) => {
    setSelectedNode(node);
    setQuestions(null);
    void fetch(`/api/questions?nodeId=${node.id}`)
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  const chapters = useMemo(() => {
    const map = new Map<string, KnowledgeNodeDTO[]>();
    for (const node of nodes ?? []) {
      const list = map.get(node.chapter) ?? [];
      list.push(node);
      map.set(node.chapter, list);
    }
    return [...map.entries()];
  }, [nodes]);

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">分级专项训练</h1>
          <p className="mt-1 text-sm text-muted-foreground">选择年级与知识点，逐题作答，即时判题并查看标准解析</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">年级</span>
          <Select value={String(grade)} onValueChange={(v) => setGradeOverride(Number(v))}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <SelectItem key={g} value={String(g)}>{gradeLabel(g)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary">数学</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* 章节知识点树 */}
        <div className="space-y-4">
          {nodes === null ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : nodes.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm text-muted-foreground">
                该年级题库正在建设中，先看看其他年级吧。
              </CardContent>
            </Card>
          ) : (
            chapters.map(([chapter, chapterNodes]) => (
              <div key={chapter}>
                <p className="mb-2 font-display text-sm font-bold text-muted-foreground">{chapter}</p>
                <div className="space-y-1.5">
                  {chapterNodes.map((node) => {
                    const stat = mastery[node.id];
                    const active = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => loadQuestions(node)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md border bg-card/70 px-3 py-2.5 text-left transition-all",
                          "hover:border-primary/50 hover:shadow-sm",
                          active && "border-primary bg-primary/5 shadow-sm",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{node.title}</span>
                          <span className="text-xs text-muted-foreground">{node.questionCount} 题</span>
                        </span>
                        <MasteryBadge level={stat?.level ?? "unknown"} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 答题区 */}
        <div>
          {!selectedNode ? (
            <Card className="grid-paper worksheet-edge flex h-full min-h-64 items-center justify-center border-dashed">
              <CardContent className="pt-0 text-center text-sm text-muted-foreground">
                <p className="font-display text-base text-foreground">← 从左侧选择一个知识点开始练习</p>
                <p className="mt-2">
                  系统会自动判题、收录错题，并按
                  <MathText content="$1/3/7$" /> 天节奏安排复习
                </p>
              </CardContent>
            </Card>
          ) : questions === null ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-sm text-muted-foreground">
                该知识点暂无题目。
                <Button asChild variant="link" size="sm"><Link href="/practice">换一个知识点</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  正在练习：<span className="font-medium text-foreground">{selectedNode.title}</span>
                  <span className="mx-2 opacity-40">|</span>{selectedNode.chapter}
                </p>
                <Button asChild size="xs" variant="outline">
                  <Link href={`/practice/reinforce?nodeId=${selectedNode.id}`}>随机变式巩固 →</Link>
                </Button>
              </div>
              <QuestionRunner questions={questions} mode="practice" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
