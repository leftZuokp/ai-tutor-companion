"use client";

/** LibreMath 结构化知识卡片（PRD 3.2.3）：适用前提 / 正例 / 反例 / 高频易错点 + 思想方法 + 前置依赖 */
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/math-text";
import type { KnowledgeCard as CardData, KnowledgeNodeDTO } from "@/lib/types";

const SECTIONS: Array<{ key: keyof CardData; label: string; className: string }> = [
  { key: "premise", label: "适用前提", className: "border-primary/30 bg-primary/5 text-primary" },
  { key: "positive", label: "正例", className: "border-mastery-strong/30 bg-mastery-strong/8 text-mastery-strong" },
  { key: "negative", label: "反例 · 易混淆", className: "border-mastery-weak/30 bg-mastery-weak/8 text-mastery-weak" },
  { key: "errors", label: "高频易错点", className: "border-mastery-mid/40 bg-mastery-mid/10 text-mastery-mid" },
];

export function KnowledgeCard({
  node,
  prereqTitles,
}: {
  node: KnowledgeNodeDTO;
  prereqTitles: string[];
}) {
  const card = node.card;
  return (
    <Collapsible className="rounded-lg border border-border bg-card/70">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold">📖 知识卡片</span>
          {node.thinkingMethods?.map((m) => (
            <Badge key={m} variant="outline" className="text-xs font-normal text-muted-foreground">{m}</Badge>
          ))}
        </span>
        <span className="text-xs text-muted-foreground transition-transform group-data-[state=open]:rotate-180">展开 ▾</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2.5 border-t border-border/60 px-4 py-3.5">
          {prereqTitles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              前置依赖：{prereqTitles.join("、")}
            </p>
          )}
          {card ? (
            SECTIONS.map(({ key, label, className }) => (
              <div key={key} className={`rounded-md border px-3 py-2 ${className}`}>
                <p className="text-xs font-semibold">{label}</p>
                <div className="mt-1 text-sm leading-7 text-foreground">
                  <MathText content={card[key]} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">该知识点暂未配置知识卡片。</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
