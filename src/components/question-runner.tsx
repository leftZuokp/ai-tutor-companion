"use client";

/**
 * 通用答题组件：全部答题场景复用。
 * - practice 模式：逐题作答、即时判题；答错后按"提示 1（条件梳理）→ 提示 2（方法联想）→ 完整解析"
 *   三级渐进揭示（苏格拉底式引导的规则化实现），杜绝"直接看解析假装听懂"。
 * - review 模式：practice + FSRS 四档自评（答对后选"困难/良好/简单"再提交）。
 * - exam 模式：整卷作答后统一交卷（摸底测评），由父级提交并生成报告。
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MathText } from "@/components/math-text";
import { RequireStudent } from "@/components/require-student";
import { useStudent } from "@/lib/student-context";
import { DIMENSION_LABELS, type Dimension, type GradedResultDTO, type QuestionDTO } from "@/lib/types";
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
  /** review 场景开启 FSRS 四档自评 */
  enableRating?: boolean;
  onFinish?: (summary: PracticeSummary) => void;
  onExamSubmit?: (answers: Array<{ questionId: string; userAnswer: string }>) => void;
  examSubmitting?: boolean;
  /** 每题附加信息（如"第 N 次复习 · 当前可检索性 82%"），key 为 questionId */
  questionMeta?: Record<string, string>;
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
  questions, mode, enableRating = false, onFinish, onExamSubmit, examSubmitting = false, questionMeta, summaryExtra,
}: QuestionRunnerProps) {
  const { current } = useStudent();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, GradedResultDTO>>({});
  const [hintLevel, setHintLevel] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.trim()).length,
    [questions, answers],
  );

  if (!current) return <RequireStudent loading={false} />;

  /* ————— 提交与判题 ————— */
  const submit = async (rating?: number) => {
    if (!question || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: current.id,
          answers: [{ questionId: question.id, userAnswer: answers[question.id] ?? "", ...(rating !== undefined ? { rating } : {}) }],
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
          <p className="mt-2 text-sm text-muted-foreground">
            正确率 {accuracy}%；错题已按 FSRS-5 记忆曲线安排复习。
          </p>
          {summaryExtra && <div className="mt-6">{summaryExtra}</div>}
        </div>
      </div>
    );
  }
  if (!question) return null;

  const result = results[question.id];
  const revealed = mode === "practice" && result !== undefined;
  const level = hintLevel[question.id] ?? 0; // 0: 未揭示 1: 提示一 2: 提示二 3: 完整解析
  const hints = result?.hints ?? null;
  // 答错且存在分步提示：未揭示到解析层时不显示完整解析
  const showExplanation = !result || result.isCorrect || !hints || level >= 3;

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
        <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground">
          {DIMENSION_LABELS[question.dimension as Dimension] ?? "综合"}
        </span>
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
              if (e.key === "Enter" && mode === "practice" && !enableRating && answers[question.id]?.trim() && !revealed) {
                void submit();
              }
            }}
          />
        </div>
      )}

      {/* 复习自评（Anki 式）：作答后选择回忆质量，随答案一并提交（答错自动按"重来"调度） */}
      {!revealed && mode === "practice" && enableRating && (
        <div className="mt-5 pl-6">
          <Separator className="mb-3 bg-border/70" />
          <p className="mb-2 text-sm text-muted-foreground">回忆自评（影响 FSRS 下次复习间隔）：</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((r) => (
              <Button
                key={r}
                size="sm"
                variant={r <= 2 ? "outline" : "default"}
                disabled={!answers[question.id]?.trim() || submitting}
                onClick={() => void submit(r)}
              >
                {["重来", "困难", "良好", "简单"][r - 1]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 判题结果：答错先分步提示，再揭示完整解析 */}
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
                {showExplanation && (
                  <>
                    <span className="mx-2 text-muted-foreground">|</span>
                    正确答案：<span className="font-semibold text-mastery-strong">
                      <MathText content={question.options ? result.answer : `$${result.answer}$`} />
                    </span>
                  </>
                )}
              </p>
            )}

            {/* 一级/二级渐进提示 */}
            {!result.isCorrect && hints && level >= 1 && (
              <div className="mt-3 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5">
                <p className="text-xs font-medium text-primary">一级提示 · 条件梳理</p>
                <div className="mt-1 text-sm leading-7"><MathText content={hints[0]} /></div>
                {level >= 2 && (
                  <>
                    <p className="mt-3 text-xs font-medium text-primary">二级提示 · 方法联想</p>
                    <div className="mt-1 text-sm leading-7"><MathText content={hints[1]} /></div>
                  </>
                )}
              </div>
            )}

            {/* 揭示控制区 */}
            {!result.isCorrect && hints && level < 3 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {level === 0 && (
                  <Button size="sm" variant="outline" onClick={() => setHintLevel((p) => ({ ...p, [question.id]: 1 }))}>
                    💡 提示一下
                  </Button>
                )}
                {level === 1 && (
                  <Button size="sm" variant="outline" onClick={() => setHintLevel((p) => ({ ...p, [question.id]: 2 }))}>
                    再给一层提示
                  </Button>
                )}
                {level === 2 && (
                  <Button size="sm" onClick={() => setHintLevel((p) => ({ ...p, [question.id]: 3 }))}>
                    我再想想，看完整解析
                  </Button>
                )}
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setHintLevel((p) => ({ ...p, [question.id]: 3 }))}
                >
                  跳过提示，直接看解析
                </button>
              </div>
            ) : showExplanation ? (
              <>
                <Separator className="my-3 bg-border/60" />
                <p className="text-sm font-medium text-muted-foreground">解析</p>
                <div className="mt-1.5 text-[15px] leading-8">
                  <MathText content={result.explanation} />
                </div>
              </>
            ) : null}

            {result.reviewNote && <p className="mt-3 text-xs text-muted-foreground">{result.reviewNote}</p>}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={nextPractice}>
              {index + 1 >= questions.length ? "完成本组" : "下一题 →"}
            </Button>
          </div>
        </div>
      )}

      {/* practice 未提交时的操作区（enableRating 模式使用上方四档自评按钮提交） */}
      {!revealed && mode === "practice" && !enableRating && (
        <div className="mt-5 flex justify-end pl-6">
          <Button onClick={() => void submit()} disabled={!answers[question.id]?.trim() || submitting}>
            {submitting ? "判题中…" : "提交本题"}
          </Button>
        </div>
      )}
    </div>
  );

  /* ————— exam 模式包装 ————— */
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

  /* ————— practice 模式包装 ————— */
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
