/** 前后端共享的 DTO 类型（答案与解析不随题目下发，交卷判题后才返回） */

export type MasteryLevel = "unknown" | "weak" | "consolidating" | "mastered";
export type QuestionType = "single_choice" | "fill_in";
/** 四能力维度（PRD 3.1）：概念理解 / 逻辑推演 / 运算准确 / 综合应用 */
export type Dimension = "concept" | "logic" | "calc" | "application";
/** 错题四类归因（PRD 3.4.1） */
export type Attribution = "concept_vague" | "logic_gap" | "calc_error" | "misread";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  concept: "概念理解",
  logic: "逻辑推演",
  calc: "运算准确",
  application: "综合应用",
};

export const ATTRIBUTION_LABELS: Record<Attribution, string> = {
  concept_vague: "概念模糊",
  logic_gap: "逻辑断层",
  calc_error: "计算失误",
  misread: "审题偏差",
};

/** LibreMath 结构化知识卡片四维度（PRD 3.2.3） */
export interface KnowledgeCard {
  premise: string; // 适用前提
  positive: string; // 正例
  negative: string; // 反例（易混淆边界）
  errors: string; // 高频易错点
}

export interface QuestionDTO {
  id: string;
  nodeId: string;
  type: QuestionType;
  content: string;
  options: string[] | null;
  difficulty: 1 | 2 | 3;
  dimension: Dimension;
}

export interface KnowledgeNodeDTO {
  id: string;
  title: string;
  subject: string;
  grade: number;
  chapter: string;
  sortOrder: number;
  questionCount: number;
  prerequisites: string[] | null;
  thinkingMethods: string[] | null;
  card: KnowledgeCard | null;
}

export interface StudentDTO {
  id: string;
  name: string;
  gradeLevel: number;
  createdAt: string;
}

export interface GradedResultDTO {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  answer: string;
  explanation: string;
  /** 三级分步提示：[条件梳理, 方法联想]，答错后逐步揭示 */
  hints: string[] | null;
  /** FSRS 调度摘要提示 */
  reviewNote: string;
}

export interface MasteryNodeStatDTO {
  nodeId: string;
  title: string;
  chapter: string;
  grade: number;
  total: number;
  correct: number;
  accuracy: number;
  level: MasteryLevel;
  /** 前置依赖穿透：沿知识拓扑追溯到的薄弱前置节点 */
  prereqIssues: Array<{ nodeId: string; title: string; level: MasteryLevel }>;
}

export interface ErrorBookItemDTO {
  id: string;
  questionId: string;
  nodeId: string;
  nodeTitle: string;
  chapter: string;
  content: string;
  options: string[] | null;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  errorCount: number;
  isResolved: boolean;
  attribution: Attribution | null;
  due: string;
  lastFailedAt: string;
  /** FSRS 可检索性：当前时刻成功回忆的概率（0-1） */
  retrievability: number;
  scheduledDays: number;
  reps: number;
}

export interface DashboardStatsDTO {
  totalSubmissions: number;
  correctCount: number;
  accuracy: number;
  resolvedCount: number;
  pendingReviewCount: number;
  weakNodes: Array<{ nodeId: string; title: string; chapter: string; errorCount: number; accuracy: number; level: MasteryLevel }>;
  chapterStats: Array<{ chapter: string; total: number; correct: number; accuracy: number }>;
  dailyStats: Array<{ date: string; total: number; correct: number; accuracy: number }>;
  masteryOverview: { weak: number; consolidating: number; mastered: number; unknown: number };
  attributionStats: Array<{ attribution: Attribution; count: number }>;
}
