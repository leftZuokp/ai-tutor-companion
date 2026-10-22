/** 种子数据结构与公共类型 */
export type SeedDimension = "concept" | "logic" | "calc" | "application";

export interface SeedQuestion {
  id: string;
  type: "single_choice" | "fill_in";
  content: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: 1 | 2 | 3;
  /** 能力维度：concept 概念理解 / logic 逻辑推演 / calc 运算准确 / application 综合应用 */
  dimension: SeedDimension;
  /** 三级分步提示：[一级-条件梳理, 二级-方法联想]，三级即解析本身（逐步揭示） */
  hints?: [string, string];
}

export interface SeedCard {
  /** 适用前提 */
  premise: string;
  /** 正例 */
  positive: string;
  /** 反例（易混淆边界） */
  negative: string;
  /** 高频易错点 */
  errors: string;
}

export interface SeedNode {
  id: string;
  title: string;
  grade: number;
  chapter: string;
  sortOrder: number;
  /** 前置依赖知识点 ID */
  prerequisites?: string[];
  /** 底层思想方法标签 */
  thinkingMethods?: string[];
  /** LibreMath 结构化知识卡片 */
  card?: SeedCard;
  questions: SeedQuestion[];
}
