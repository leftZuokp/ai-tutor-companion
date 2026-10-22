/**
 * 掌握度统计服务：
 * 1. 聚合学生在指定范围内各知识点的答题数据并应用红黄绿规则；
 * 2. 前置依赖穿透（PRD 3.1）：对薄弱节点沿知识拓扑向树根追溯（跨年级），
 *    定位其底层前置概念的掌握缺陷，为专项提升提供精准靶点。
 */
import { prisma } from "@/lib/prisma";
import { computeMastery, type MasteryLevel } from "@/lib/rules/mastery";
import type { MasteryNodeStatDTO } from "@/lib/types";

export interface MasteryScope {
  grade?: number;
  subject?: string;
  nodeIds?: string[];
}

const MAX_PREREQ_CHAIN = 4; // 追溯链最大展示数

async function buildStats(
  userId: string,
  where: Record<string, unknown>,
): Promise<{ stats: Map<string, MasteryNodeStatDTO>; prereqMap: Map<string, string[]> }> {
  const nodes = await prisma.knowledgeNode.findMany({
    where,
    orderBy: [{ grade: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      title: true,
      chapter: true,
      grade: true,
      prerequisites: true,
      questions: { select: { submissions: { where: { userId }, orderBy: { createdAt: "asc" } } } },
    },
  });

  const stats = new Map<string, MasteryNodeStatDTO>();
  const prereqMap = new Map<string, string[]>();
  for (const node of nodes) {
    const submissions = node.questions.flatMap((q) =>
      q.submissions.map((s) => ({ isCorrect: s.isCorrect, createdAt: s.createdAt })),
    );
    submissions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const total = submissions.length;
    const correct = submissions.filter((s) => s.isCorrect).length;
    const level: MasteryLevel = computeMastery(submissions);

    stats.set(node.id, {
      nodeId: node.id,
      title: node.title,
      chapter: node.chapter,
      grade: node.grade,
      total,
      correct,
      accuracy: total === 0 ? 0 : correct / total,
      level,
      prereqIssues: [],
    });
    prereqMap.set(node.id, node.prerequisites ? (JSON.parse(node.prerequisites) as string[]) : []);
  }
  return { stats, prereqMap };
}

export async function getMasteryStats(
  userId: string,
  scope: MasteryScope,
): Promise<MasteryNodeStatDTO[]> {
  const scopeWhere = {
    ...(scope.subject ? { subject: scope.subject } : {}),
    ...(scope.grade ? { grade: scope.grade } : {}),
    ...(scope.nodeIds ? { id: { in: scope.nodeIds } } : {}),
  };
  const scoped = await buildStats(userId, scopeWhere);

  // 前置依赖闭包：跨年级把前置链上的节点全部纳入判定（只作穿透依据，不随结果返回）
  const full = new Map(scoped.stats);
  const fullPrereq = new Map(scoped.prereqMap);
  const queue = [...fullPrereq.values()].flat();
  const visited = new Set(fullPrereq.keys());
  while (queue.length > 0) {
    const batch = [...new Set(queue.filter((id) => !visited.has(id)))];
    queue.length = 0;
    if (batch.length === 0) break;
    for (const id of batch) visited.add(id);
    const aux = await buildStats(userId, { id: { in: batch } });
    for (const [id, stat] of aux.stats) {
      if (!full.has(id)) full.set(id, stat);
      fullPrereq.set(id, aux.prereqMap.get(id) ?? []);
    }
    queue.push(...[...fullPrereq.values()].flat());
  }

  // 前置依赖穿透：仅对薄弱（红/黄）节点向上追溯非绿的前置节点
  for (const stat of scoped.stats.values()) {
    if (stat.level !== "weak" && stat.level !== "consolidating") continue;
    const chainQueue = [...(fullPrereq.get(stat.nodeId) ?? [])];
    const seen = new Set<string>([stat.nodeId]);
    const issues: MasteryNodeStatDTO["prereqIssues"] = [];
    while (chainQueue.length > 0 && issues.length < MAX_PREREQ_CHAIN) {
      const id = chainQueue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const parent = full.get(id);
      if (!parent) continue;
      if (parent.level === "weak" || parent.level === "consolidating") {
        issues.push({ nodeId: parent.nodeId, title: parent.title, level: parent.level });
      }
      chainQueue.push(...(fullPrereq.get(id) ?? []));
    }
    stat.prereqIssues = issues;
  }

  return [...scoped.stats.values()];
}
