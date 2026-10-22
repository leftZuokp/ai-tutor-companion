"use client";

/** 错题本：按知识点折叠分组，展示错误频次与复习计划，一键发起专项提升 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MathText } from "@/components/math-text";
import { RequireStudent } from "@/components/require-student";
import { useStudent } from "@/lib/student-context";
import type { ErrorBookItemDTO } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function stageText(item: ErrorBookItemDTO): string {
  if (item.isResolved) return "已通关";
  return `第${[1, 3, 7][item.reviewStage]}天节点 · ${formatDate(item.nextReviewDate)} 到期`;
}

export default function MistakesPage() {
  const { current, students } = useStudent();
  const [items, setItems] = useState<ErrorBookItemDTO[] | null>(null);

  useEffect(() => {
    if (!current) return;
    void fetch(`/api/review?userId=${current.id}&scope=all`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [current]);

  const groups = useMemo(() => {
    const map = new Map<string, ErrorBookItemDTO[]>();
    for (const item of items ?? []) {
      const key = item.nodeTitle;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  if (students === null) return <RequireStudent loading />;
  if (!current) return <RequireStudent />;

  const pending = groups.filter(([, list]) => list.some((i) => !i.isResolved));
  const resolved = groups.map(([title, list]) => [title, list.filter((i) => i.isResolved)] as const).filter(([, list]) => list.length > 0);

  const renderGroup = (title: string, list: ErrorBookItemDTO[], valuePrefix: string) => (
    <AccordionItem key={valuePrefix + title} value={valuePrefix + title}>
      <AccordionTrigger className="hover:no-underline">
        <span className="flex flex-1 items-center justify-between gap-3 pr-3 text-left">
          <span className="font-display text-base font-bold">{title}</span>
          <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            <span>{list.length} 题</span>
            <span className="text-mastery-weak">累计错误 {list.reduce((s, i) => s + i.errorCount, 0)} 次</span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="space-y-2.5">
        {list.map((item) => (
          <div key={item.id} className="rounded-md border border-border bg-card/80 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{item.chapter}</Badge>
              <span className="text-mastery-mid">{stageText(item)}</span>
              <span>· 错 {item.errorCount} 次</span>
              {item.isResolved && (
                <Badge variant="outline" className="border-mastery-strong/40 bg-mastery-strong/10 text-mastery-strong">已通关</Badge>
              )}
            </div>
            <div className="mt-2.5 text-[15px] leading-7">
              <MathText content={item.content} />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              {!item.isResolved && (
                <Button asChild size="xs">
                  <Link href={`/practice/reinforce?nodeId=${item.nodeId}`}>专项提升</Link>
                </Button>
              )}
              <Button asChild size="xs" variant="outline">
                <Link href={`/practice?node=${item.nodeId}`}>知识点练习</Link>
              </Button>
            </div>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  );

  const empty = items !== null && items.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">错题本</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          做错的题自动按知识点归档；点击「专项提升」获取同知识点变式题巩固
        </p>
      </div>

      {items === null ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : empty ? (
        <Card className="grid-paper worksheet-edge">
          <CardContent className="py-10 text-center">
            <p className="font-display text-lg font-bold">错题本是空的 🎉</p>
            <p className="mt-2 text-sm text-muted-foreground">
              还没有错题记录。去<Link href="/practice" className="text-primary underline-offset-2 hover:underline">专项训练</Link>
              刷几组题，或先做一次<Link href="/assessment" className="text-primary underline-offset-2 hover:underline">摸底测评</Link>。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">待攻克（{pending.reduce((s, [, l]) => s + l.length, 0)}）</TabsTrigger>
            <TabsTrigger value="resolved">已通关（{resolved.reduce((s, [, l]) => s + l.length, 0)}）</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-3">
            {pending.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">全部错题都已通关，太棒了！🎉</p>
            ) : (
              <Accordion type="multiple" className="rounded-lg border border-border bg-card/40 px-4">
                {pending.map(([title, list]) => renderGroup(title, list, "p-"))}
              </Accordion>
            )}
          </TabsContent>
          <TabsContent value="resolved" className="mt-3">
            {resolved.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">还没有通关的错题。复习节奏：做错后第 1 / 3 / 7 天答对即通关。</p>
            ) : (
              <Accordion type="multiple" className="rounded-lg border border-border bg-card/40 px-4">
                {resolved.map(([title, list]) => renderGroup(title, list, "r-"))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
