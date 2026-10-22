/**
 * 种子数据入口：数学题库 G5~G9，24 个知识点，约 115 题
 * 幂等设计：知识点与题目均使用稳定 ID，可重复执行。
 * 数据源见 seed-data/（按年级分文件，含知识卡片/前置依赖/思想方法/能力维度/分步提示）。
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { ALL_NODES } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  for (const node of ALL_NODES) {
    const data = {
      title: node.title,
      subject: "math",
      grade: node.grade,
      chapter: node.chapter,
      sortOrder: node.sortOrder,
      prerequisites: node.prerequisites ? JSON.stringify(node.prerequisites) : null,
      thinkingMethods: node.thinkingMethods ? JSON.stringify(node.thinkingMethods) : null,
      card: node.card ? JSON.stringify(node.card) : null,
    };
    await prisma.knowledgeNode.upsert({
      where: { id: node.id },
      create: { id: node.id, ...data },
      update: data,
    });

    for (const [index, q] of node.questions.entries()) {
      const qData = {
        nodeId: node.id,
        type: q.type,
        content: q.content,
        options: q.options ? JSON.stringify(q.options) : null,
        answer: q.answer,
        explanation: q.explanation,
        hints: q.hints ? JSON.stringify(q.hints) : null,
        dimension: q.dimension,
        difficulty: q.difficulty,
        sortOrder: index + 1,
      };
      await prisma.question.upsert({
        where: { id: q.id },
        create: { id: q.id, ...qData },
        update: qData,
      });
    }
  }

  const [nodeCount, questionCount, hintCount] = await Promise.all([
    prisma.knowledgeNode.count(),
    prisma.question.count(),
    prisma.question.count({ where: { hints: { not: null } } }),
  ]);
  const byGrade: Record<number, number> = {};
  for (const node of ALL_NODES) byGrade[node.grade] = (byGrade[node.grade] ?? 0) + node.questions.length;
  console.log(
    `种子完成：${nodeCount} 个知识点，${questionCount} 道题（含提示 ${hintCount} 道）。分布：`,
    Object.entries(byGrade).map(([g, n]) => `G${g}:${n}题`).join(" "),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
