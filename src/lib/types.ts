/** 前后端共享的 DTO 类型（答案与解析不随题目下发，交卷判题后才返回） */

export type MasteryLevel = "unknown" | "weak" | "consolidating" | "mastered";
export type QuestionType = "single_choice" | "fill_in";

export interface QuestionDTO {
  id: string;
  nodeId: string;
  type: QuestionType;
  content: string;
  options: string[] | null;
  difficulty: 1 | 2 | 3;
}

export interface KnowledgeNodeDTO {
  id: string;
  title: string;
  subject: string;
  grade: number;
  chapter: string;
  sortOrder: number;
  questionCount: number;
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
  reviewAdvanced: boolean;
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
  reviewStage: number;
  nextReviewDate: string;
  lastFailedAt: string;
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
}
