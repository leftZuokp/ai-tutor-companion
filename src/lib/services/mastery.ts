/**
 * 掌握度统计服务：聚合某学生在指定范围内各知识点的答题数据并应用掌握度规则。
 */
import { prisma } from "@/lib/prisma";
import { computeMastery, type MasteryLevel } from "@/lib/rules/mastery";
import type { MasteryNodeStatDTO } from "@/lib/types";

export interface MasteryScope {
  grade?: number;
  subject?: string;
  nodeIds?: string[];
}

export async function getMasteryStats(
  userId: string,
  scope: MasteryScope,
): Promise<MasteryNodeStatDTO[]> {
  const nodes = await prisma.knowledgeNode.findMany({
    where: {
      ...(scope.subject ? { subject: scope.subject } : {}),
      ...(scope.grade ? { grade: scope.grade } : {}),
      ...(scope.nodeIds ? { id: { in: scope.nodeIds } } : {}),
    },
    orderBy: [{ grade: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      title: true,
      chapter: true,
      grade: true,
      questions: { select: { submissions: { where: { userId }, orderBy: { createdAt: "asc" } } } },
    },
  });

  return nodes.map((node) => {
    const submissions = node.questions.flatMap((q) =>
      q.submissions.map((s) => ({ isCorrect: s.isCorrect, createdAt: s.createdAt })),
    );
    submissions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const total = submissions.length;
    const correct = submissions.filter((s) => s.isCorrect).length;
    const level: MasteryLevel = computeMastery(submissions);

    return {
      nodeId: node.id,
      title: node.title,
      chapter: node.chapter,
      grade: node.grade,
      total,
      correct,
      accuracy: total === 0 ? 0 : correct / total,
      level,
    };
  });
}
