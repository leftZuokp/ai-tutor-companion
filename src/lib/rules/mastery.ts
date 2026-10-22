/**
 * 掌握度诊断规则（PRD 3.1）
 *
 * 基于某知识点最近 5 次答题记录判定掌握状态：
 * - weak（红）        ：最近连续做错 2 题，或近 5 题正确率 < 60%
 * - mastered（绿）    ：最近连续做对 3 题，或近 5 题正确率 ≥ 80%
 * - consolidating（黄）：介于两者之间（60% ≤ 正确率 < 80%）
 * - unknown（灰）     ：从未做过该知识点的题
 *
 * 判定优先级：连续错误 > 连续正确 > 正确率阈值，避免边界冲突。
 */

export type MasteryLevel = "unknown" | "weak" | "consolidating" | "mastered";

export interface MasterySubmission {
  isCorrect: boolean;
}

/** 计算单个知识点的掌握度；submissions 按时间升序（旧→新） */
export function computeMastery(recent: MasterySubmission[]): MasteryLevel {
  if (recent.length === 0) return "unknown";

  const window = recent.slice(-5); // 只看最近 5 题
  const total = window.length;
  const correct = window.filter((s) => s.isCorrect).length;
  const accuracy = correct / total;

  const last2 = window.slice(-2);
  const last3 = window.slice(-3);

  // 红：最近连续做错 2 题
  if (last2.length === 2 && last2.every((s) => !s.isCorrect)) return "weak";
  // 绿：最近连续做对 3 题
  if (last3.length === 3 && last3.every((s) => s.isCorrect)) return "mastered";
  if (accuracy >= 0.8) return "mastered";
  if (accuracy < 0.6) return "weak";
  return "consolidating";
}

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  unknown: "未接触",
  weak: "未掌握",
  consolidating: "巩固中",
  mastered: "已掌握",
};
