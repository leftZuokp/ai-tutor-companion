"use client";

/** 分级专项训练：年级 → 学科(数学) → 章节/知识点 → 逐题练习（含知识卡片与多维筛选） */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MasteryBadge } from "@/components/mastery-badge";
import { KnowledgeCard } from "@/components/knowledge-card";
import { QuestionRunner, type RunnerQuestion } from "@/components/question-runner";
import { RequireStudent } from "@/components/require-student";
import { gradeLabel } from "@/lib/grade";
import { useStudent } from "@/lib/student-context";
import type { KnowledgeNodeDTO, MasteryNodeStatDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTER_ALL = "all";

export default function PracticePage() {
  const { current, students } = useStudent();
  // 年级默认跟随学生档案，用户手动切换后以手动选择为准
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const grade = gradeOverride ?? current?.gradeLevel ?? 7;
  const [nodes, setNodes] = useState<KnowledgeNodeDTO[] | null>(null);
  const [mastery, setMastery] = useState<Record<string, MasteryNodeStatDTO>>({});
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeDTO | null>(null);
  const [questions, setQuestions] = useState<RunnerQuestion[] | null>(null);
  // 多维筛选（参考刺豚数学题库）：难度 / 题型
  const [difficulty, setDifficulty] = useState<string>(FILTER_ALL);
  const [questionType, setQuestionType] = useState<string>(FILTER_ALL);

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

  const loadQuestions = useCallback(
    (node: KnowledgeNodeDTO, diff: string, type: string) => {
      setSelectedNode(node);
      setQuestions(null);
      const params = new URLSearchParams({ nodeId: node.id });
      if (diff !== FILTER_ALL) params.set("difficulty", diff);
      if (type !== FILTER_ALL) params.set("type", type === "single_choice" ? "single_choice" : "fill_in");
      void fetch(`/api/questions?${params}`)
        .then((r) => r.json())
        .then(setQuestions);
    },
    [],
  );

  const applyFilter = (diff: string, type: string) => {
    setDifficulty(diff);
    setQuestionType(type);
    if (selectedNode) loadQuestions(selectedNode, diff, type);
  };

  const chapters = useMemo(() => {
    const map = new Map<string, KnowledgeNodeDTO[]>();
    for (const node of nodes ?? []) {
      const list = map.get(node.chapter) ?? [];
      list.push(node);
      map.set(node.chapter, list);
    }
    return [...map.entries()];
  }, [nodes]);

  const totalQuestions = (nodes ?? []).reduce((s, n) => s + n.questionCount, 0);
  // 全量知识点标题表：用于把跨年级前置依赖 ID 映射为可读标题
  const [titleById, setTitleById] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    void fetch("/api/knowledge")
      .then((r) => r.json())
      .then((list: KnowledgeNodeDTO[]) =>
        setTitleById(new Map(list.map((n) => [n.id, n.title]))),
      );
  }, []);

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">分级专项训练</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {nodes ? `${nodes.length} 个知识点 · ${totalQuestions} 道题 · 逐题作答，答错可分步提示` : "选择年级与知识点开始练习"}
          </p>
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
                        onClick={() => loadQuestions(node, difficulty, questionType)}
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
        <div className="space-y-3">
          {!selectedNode ? (
            <Card className="grid-paper worksheet-edge flex h-full min-h-64 items-center justify-center border-dashed">
              <CardContent className="pt-0 text-center text-sm text-muted-foreground">
                <p className="font-display text-base text-foreground">← 从左侧选择一个知识点开始练习</p>
                <p className="mt-2">答错自动进错题本，由 FSRS-5 记忆引擎安排复习</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  正在练习：<span className="font-medium text-foreground">{selectedNode.title}</span>
                  <span className="mx-2 opacity-40">|</span>{selectedNode.chapter}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <Select value={difficulty} onValueChange={(v) => applyFilter(v, questionType)}>
                    <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL}>全部难度</SelectItem>
                      <SelectItem value="1">易</SelectItem>
                      <SelectItem value="2">中</SelectItem>
                      <SelectItem value="3">难</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={questionType} onValueChange={(v) => applyFilter(difficulty, v)}>
                    <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL}>全部题型</SelectItem>
                      <SelectItem value="single_choice">选择题</SelectItem>
                      <SelectItem value="fill_in">填空题</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/practice/reinforce?nodeId=${selectedNode.id}`}>随机变式巩固 →</Link>
                  </Button>
                </div>
              </div>

              <KnowledgeCard
                node={selectedNode}
                prereqTitles={(selectedNode.prerequisites ?? []).map((id) => titleById.get(id) ?? id)}
              />

              {questions === null ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : questions.length === 0 ? (
                <Card>
                  <CardContent className="pt-5 text-sm text-muted-foreground">
                    当前筛选条件下没有题目，试试放宽难度或题型筛选。
                  </CardContent>
                </Card>
              ) : (
                <QuestionRunner questions={questions} mode="practice" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
