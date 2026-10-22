"use client";

/**
 * 通用答题组件：全部答题场景复用。
 * - practice 模式：逐题作答、即时判题、展示解析（专项训练 / 变式巩固 / 今日复习）
 * - exam 模式：整卷作答后统一交卷（摸底测评），由父级提交并生成报告
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MathText } from "@/components/math-text";
import { RequireStudent } from "@/components/require-student";
import { useStudent } from "@/lib/student-context";
import type { GradedResultDTO, QuestionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface RunnerQuestion extends QuestionDTO {
  nodeTitle?: string;
  chapter?: string;
}

export interface PracticeSummary {
  total: number;
  correct: number;
}

interface QuestionRunnerProps {
  questions: RunnerQuestion[];
  mode: "practice" | "exam";
  /** practice 完成一组后回调 */
  onFinish?: (summary: PracticeSummary) => void;
  /** exam 交卷回调（已答题目） */
  onExamSubmit?: (answers: Array<{ questionId: string; userAnswer: string }>) => void;
  examSubmitting?: boolean;
  /** 每题附加信息（如复习阶段提示），key 为 questionId */
  questionMeta?: Record<string, string>;
  /** 完成页额外内容（如返回入口） */
  summaryExtra?: React.ReactNode;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function DifficultyStars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="text-xs text-muted-foreground" title={`难度 ${level}/3`}>
      {"★".repeat(level)}
      <span className="opacity-30">{"★".repeat(3 - level)}</span>
    </span>
  );
}

export function QuestionRunner({
  questions, mode, onFinish, onExamSubmit, examSubmitting = false, questionMeta, summaryExtra,
}: QuestionRunnerProps) {
  const { current } = useStudent();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, GradedResultDTO>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.trim()).length,
    [questions, answers],
  );

  if (!current) return <RequireStudent loading={false} />;
  if (!question && !finished) return null;

  /* ————— practice 模式 ————— */
  const submitPractice = async () => {
    if (!question || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: current.id,
          answers: [{ questionId: question.id, userAnswer: answers[question.id] ?? "" }],
        }),
      });
      const data = await res.json();
      const result: GradedResultDTO | undefined = data?.results?.[0];
      if (result) setResults((prev) => ({ ...prev, [question.id]: result }));
    } finally {
      setSubmitting(false);
    }
  };

  const finishPractice = () => {
    const correct = questions.filter((q) => results[q.id]?.isCorrect).length;
    setFinished(true);
    onFinish?.({ total: questions.length, correct });
  };

  if (finished && mode === "practice") {
    const correct = questions.filter((q) => results[q.id]?.isCorrect).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <div className="grid-paper worksheet-edge mx-auto max-w-2xl rounded-lg border border-border p-8 shadow-sm">
        <div className="pl-6 text-center">
          <p className="font-display text-lg font-bold">本组练习完成</p>
          <p className="mt-3 text-5xl font-bold tabular-nums text-primary">
            {correct}<span className="text-xl text-muted-foreground"> / {questions.length}</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">正确率 {accuracy}%，错题已自动收入错题本。</p>
          {summaryExtra && <div className="mt-6">{summaryExtra}</div>}
        </div>
      </div>
    );
  }
  if (!question) return null;

  const result = results[question.id];
  const revealed = mode === "practice" && result !== undefined;

  const setAnswer = (value: string) => {
    if (revealed) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const nextPractice = () => {
    if (index + 1 >= questions.length) finishPractice();
    else setIndex(index + 1);
  };

  const submitExam = () => {
    const payload = questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ questionId: q.id, userAnswer: answers[q.id] }));
    onExamSubmit?.(payload);
  };

  /* ————— 题目卡片 ————— */
  const card = (
    <div className="grid-paper worksheet-edge rounded-lg border border-border p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2 pl-6">
        <span className="font-display text-sm font-bold text-primary">
          第 {index + 1} 题 / 共 {questions.length} 题
        </span>
        <DifficultyStars level={question.difficulty} />
        {question.nodeTitle && (
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
            {question.nodeTitle}
          </span>
        )}
        {questionMeta?.[question.id] && (
          <span className="rounded-full border border-mastery-mid/40 bg-mastery-mid/10 px-2 py-0.5 text-xs text-mastery-mid">
            {questionMeta[question.id]}
          </span>
        )}
        {question.type === "fill_in" && (
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">填空题</span>
        )}
      </div>

      <div className="pl-6 pt-4 text-[17px] leading-8">
        <MathText content={question.content} />
      </div>

      {question.options ? (
        <div className="mt-5 grid gap-2.5 pl-6">
          {question.options.map((option, i) => {
            const letter = LETTERS[i];
            const selected = answers[question.id] === letter;
            const isRight = revealed && result?.answer === letter;
            const isWrongPick = revealed && selected && !result?.isCorrect;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setAnswer(letter)}
                disabled={revealed}
                className={cn(
                  "flex items-center gap-3 rounded-md border bg-card/80 px-3.5 py-2.5 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-sm",
                  selected && !revealed && "border-primary bg-primary/5 shadow-sm",
                  isRight && "border-mastery-strong bg-mastery-strong/10",
                  isWrongPick && "border-mastery-weak bg-mastery-weak/10",
                  revealed && !isRight && !isWrongPick && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                    isRight && "border-mastery-strong bg-mastery-strong text-white",
                    isWrongPick && "border-mastery-weak bg-mastery-weak text-white",
                  )}
                >
                  {letter}
                </span>
                <MathText content={option} className="text-[15px] leading-7" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 pl-6">
          <Input
            value={answers[question.id] ?? ""}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={revealed}
            placeholder="在此填写答案（分数用 a/b 表示，如 4/5）"
            className="max-w-sm bg-card/80"
            onKeyDown={(e) => {
              if (e.key === "Enter" && mode === "practice" && answers[question.id]?.trim() && !revealed) {
                void submitPractice();
              }
            }}
          />
        </div>
      )}

      {/* 判题结果与解析 */}
      {revealed && result && (
        <div className="mt-5 pl-6">
          <Separator className="mb-4 bg-border/80" />
          <div
            className={cn(
              "rounded-md border px-4 py-3",
              result.isCorrect ? "border-mastery-strong/40 bg-mastery-strong/8" : "border-mastery-weak/40 bg-mastery-weak/8",
            )}
          >
            <p className={cn("font-display text-sm font-bold", result.isCorrect ? "text-mastery-strong" : "text-mastery-weak")}>
              {result.isCorrect ? "✓ 回答正确" : "✗ 回答错误"}
            </p>
            {!result.isCorrect && (
              <p className="mt-1.5 text-sm">
                你的答案：<span className="text-mastery-weak">{result.userAnswer || "（未作答）"}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                正确答案：<span className="font-semibold text-mastery-strong">
                  <MathText content={question.options ? result.answer : `$${result.answer}$`} />
                </span>
              </p>
            )}
            <Separator className="my-3 bg-border/60" />
            <p className="text-sm font-medium text-muted-foreground">解析</p>
            <div className="mt-1.5 text-[15px] leading-8">
              <MathText content={result.explanation} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {result.isCorrect
                ? result.reviewAdvanced ? "✓ 错题复习计划已推进（艾宾浩斯）" : ""
                : "已自动收入错题本，将按第 1 / 3 / 7 天节奏提醒复习。"}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={nextPractice}>
              {index + 1 >= questions.length ? "完成本组" : "下一题 →"}
            </Button>
          </div>
        </div>
      )}

      {/* practice 未提交时的操作区 */}
      {!revealed && mode === "practice" && (
        <div className="mt-5 flex justify-end pl-6">
          <Button onClick={() => void submitPractice()} disabled={!answers[question.id]?.trim() || submitting}>
            {submitting ? "判题中…" : "提交本题"}
          </Button>
        </div>
      )}
    </div>
  );

  /* ————— exam 模式包装：题号导航 + 交卷 ————— */
  if (mode === "exam") {
    return (
      <div className="space-y-4">
        <div>{card}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
            ← 上一题
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex(Math.min(questions.length - 1, index + 1))}
            disabled={index === questions.length - 1}
          >
            下一题 →
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            已答 {answeredCount} / {questions.length}
          </span>
          <Button onClick={submitExam} disabled={answeredCount < questions.length || examSubmitting}>
            {examSubmitting ? "评分中…" : "交卷并生成诊断报告"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card/60 p-3">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "size-7 rounded border text-xs tabular-nums transition-colors",
                i === index ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
                answers[q.id]?.trim() && i !== index && "border-primary/40 text-primary",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ————— practice 模式包装：进度条 ————— */
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={((index + (revealed ? 1 : 0)) / questions.length) * 100} className="h-1.5 flex-1" />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {index + 1} / {questions.length}
        </span>
      </div>
      {card}
    </div>
  );
}
