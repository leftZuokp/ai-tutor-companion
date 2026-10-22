"use client";

/** 知识点掌握度徽章：红（未掌握）/ 黄（巩固中）/ 绿（已掌握）/ 灰（未接触） */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MASTERY_LABELS, type MasteryLevel } from "@/lib/rules/mastery";

const STYLES: Record<MasteryLevel, string> = {
  weak: "border-mastery-weak/40 bg-mastery-weak/10 text-mastery-weak",
  consolidating: "border-mastery-mid/45 bg-mastery-mid/10 text-mastery-mid",
  mastered: "border-mastery-strong/40 bg-mastery-strong/10 text-mastery-strong",
  unknown: "border-border bg-muted text-muted-foreground",
};

const DOTS: Record<MasteryLevel, string> = {
  weak: "bg-mastery-weak",
  consolidating: "bg-mastery-mid",
  mastered: "bg-mastery-strong",
  unknown: "bg-muted-foreground/40",
};

export function MasteryBadge({ level, className }: { level: MasteryLevel; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", STYLES[level], className)}>
      <span className={cn("size-1.5 rounded-full", DOTS[level])} />
      {MASTERY_LABELS[level]}
    </Badge>
  );
}

export function MasteryDot({ level, className }: { level: MasteryLevel; className?: string }) {
  return <span className={cn("inline-block size-2 rounded-full", DOTS[level], className)} />;
}
