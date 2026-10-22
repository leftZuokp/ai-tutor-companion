"use client";

/**
 * 摸底测评（闭环起点）：选年级 → 生成覆盖全部知识点的诊断卷 → 整卷作答 →
 * 交卷评分 → 薄弱点报告（红黄绿 + 专项提升入口）。错题自动入库并排复习计划。
 */
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MasteryBadge } from "@/components/mastery-badge";
import { QuestionRunner, type RunnerQuestion } from "@/components/question-runner";
import { RequireStudent } from "@/components/require-student";
import { gradeLabel } from "@/lib/grade";
import { useStudent } from "@/lib/student-context";
import type { GradedResultDTO, MasteryNodeStatDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AssessmentQuestion extends RunnerQuestion {
  nodeTitle: string;
  chapter: string;
}

type Step = "idle" | "exam" | "report";

export default function AssessmentPage() {
  const { current, students } = useStudent();
  const [step, setStep] = useState<Step>("idle");
  // 年级默认跟随学生档案，用户手动切换后以手动选择为准
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const grade = gradeOverride ?? current?.gradeLevel ?? 7;
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [results, setResults] = useState<GradedResultDTO[]>([]);
  const [mastery, setMastery] = useState<MasteryNodeStatDTO[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: current.id, grade, subject: "math" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "组卷失败");
      setQuestions(data.questions ?? []);
      setResults([]);
      setMastery(null);
      setStep("exam");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "组卷失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  };

  const submitExam = async (answers: Array<{ questionId: string; userAnswer: string }>) => {
    if (!current) return;
    setBusy(true);
    try {
      // 1. 交卷判题（错题自动入库并排复习计划）
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: current.id, answers }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      // 2. 拉取规则引擎诊断结果
      const params = new URLSearchParams({ userId: current.id, grade: String(grade), subject: "math" });
      const mres = await fetch(`/api/mastery?${params}`);
      const mdata = await mres.json();
      setMastery(mdata.stats ?? []);
      setStep("report");
      window.scrollTo({ top: 0 });
    } finally {
      setBusy(false);
    }
  };

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  /* ————— 报告 ————— */
  if (step === "report") {
    const total = results.length;
    const correct = results.filter((r) => r.isCorrect).length;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const touched = (mastery ?? []).filter((m) => m.total > 0);
    const order = { weak: 0, consolidating: 1, mastered: 2, unknown: 3 };
    const sorted = [...touched].sort((a, b) => order[a.level] - order[b.level] || a.accuracy - b.accuracy);
    const weakCount = touched.filter((m) => m.level === "weak").length;

    // 四能力维度得分（PRD 3.1）：概念理解 / 逻辑推演 / 运算准确 / 综合应用
    const dimAgg = new Map<string, { total: number; correct: number }>();
    const qMap = new Map((questions ?? []).map((q) => [q.id, q]));
    for (const r of results) {
      const dim = qMap.get(r.questionId)?.dimension ?? "concept";
      const agg = dimAgg.get(dim) ?? { total: 0, correct: 0 };
      agg.total += 1;
      if (r.isCorrect) agg.correct += 1;
      dimAgg.set(dim, agg);
    }
    const DIM_NAMES: Record<string, string> = {
      concept: "概念理解",
      logic: "逻辑推演",
      calc: "运算准确",
      application: "综合应用",
    };

    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold">摸底测评报告</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {gradeLabel(grade)} · 数学 · 规则引擎基于本次作答生成诊断
          </p>
        </div>

        <Card className="grid-paper worksheet-edge">
          <CardContent className="pl-6 pt-6 text-center">
            <p className="font-display text-4xl font-bold tabular-nums text-primary">
              {accuracy}<span className="text-lg text-muted-foreground">%</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              共 {total} 题，答对 {correct} 题 · 覆盖知识点 {touched.length} 个，其中 {weakCount} 个未掌握
            </p>
          </CardContent>
        </Card>

        {/* 四能力维度诊断 */}
        {total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">能力维度诊断</CardTitle>
              <CardDescription>概念理解 / 逻辑推演 / 运算准确 / 综合应用 四维得分</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.keys(DIM_NAMES).map((dim) => {
                const agg = dimAgg.get(dim);
                const pct = agg && agg.total > 0 ? Math.round((agg.correct / agg.total) * 100) : null;
                return (
                  <div key={dim} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm font-medium">{DIM_NAMES[dim]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct === null ? "bg-muted-foreground/20" : pct >= 80 ? "bg-mastery-strong" : pct >= 60 ? "bg-mastery-mid" : "bg-mastery-weak",
                        )}
                        style={{ width: pct === null ? "100%" : `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {pct === null ? "未考察" : `${agg!.correct}/${agg!.total} · ${pct}%`}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display">知识点诊断（红 / 黄 / 绿）</CardTitle>
            <CardDescription>判定规则：近 5 题正确率低于 60% 或连错 2 题为红；连对 3 题或达 80% 为绿</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {sorted.map((node) => (
              <div key={node.nodeId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{node.title}</p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {node.correct}/{node.total} · {Math.round(node.accuracy * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        node.level === "weak" && "bg-mastery-weak",
                        node.level === "consolidating" && "bg-mastery-mid",
                        node.level === "mastered" && "bg-mastery-strong",
                      )}
                      style={{ width: `${Math.max(node.accuracy * 100, 4)}%` }}
                    />
                  </div>
                  {node.prereqIssues.length > 0 && (
                    <p className="mt-1 text-xs text-mastery-weak">
                      前置穿透：根因可能是「{node.prereqIssues.map((p) => p.title).join("、")}」掌握不牢
                    </p>
                  )}
                </div>
                <MasteryBadge level={node.level} />
                {node.level !== "mastered" && (
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/practice/reinforce?nodeId=${node.nodeId}`}>专项提升</Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          <Button asChild variant="outline"><Link href="/practice">去专项训练</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard">查看学情看板</Link></Button>
          <Button variant="outline" onClick={() => setStep("idle")}>再测一次</Button>
        </div>
      </div>
    );
  }

  /* ————— 答卷 ————— */
  if (step === "exam" && questions) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold">摸底测评 · {gradeLabel(grade)}数学</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {questions.length} 题，覆盖 {new Set(questions.map((q) => q.nodeId)).size} 个知识点。请独立完成后交卷，系统将自动生成诊断报告。
          </p>
        </div>
        <QuestionRunner questions={questions} mode="exam" onExamSubmit={submitExam} examSubmitting={busy} />
      </div>
    );
  }

  /* ————— 入口 ————— */
  return (
    <div className="mx-auto max-w-xl space-y-5 pt-6">
      <Card className="grid-paper worksheet-edge">
        <CardHeader className="pl-6">
          <CardTitle className="font-display text-xl">入学摸底测评</CardTitle>
          <CardDescription>
            测试 → 诊断 → 巩固 → 反馈 闭环的第一步。系统将从本年级每个知识点抽取题目组成诊断卷，
            交卷后自动生成红黄绿掌握度报告；做错的题会进入错题本并按第 1 / 3 / 7 天节奏安排复习。
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">年级</span>
            <Select value={String(grade)} onValueChange={(v) => setGradeOverride(Number(v))}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <SelectItem key={g} value={String(g)}>{gradeLabel(g)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Button className="mt-5" size="lg" onClick={() => void start()} disabled={busy}>
            {busy ? "组卷中…" : "开始测评 →"}
          </Button>
        </CardContent>
      </Card>
      {busy && <Skeleton className="h-8 w-40" />}
    </div>
  );
}
