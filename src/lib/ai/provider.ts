/**
 * AI 能力扩展点（二期接入）
 *
 * MVP 为纯规则驱动（见 PRD），不调用任何大模型。
 * 二期接入 GLM / OpenAI 等模型时，只需实现 AiProvider 接口并在
 * getAiProvider() 中返回实现，业务侧调用点（错题 AI 讲解、AI 变式题）
 * 会自动启用——未配置时业务侧始终回退到题库标准解析与规则推荐。
 */

export interface AiExplainInput {
  /** 题干 */
  content: string;
  /** 学生答案 */
  userAnswer: string;
  /** 是否答对 */
  isCorrect: boolean;
}

export interface AiVariantInput {
  /** 被巩固的题目 */
  content: string;
  answer: string;
  /** 知识点标题 */
  nodeTitle: string;
  /** 生成数量 */
  count: number;
}

export interface AiGeneratedQuestion {
  content: string;
  options: string[] | null;
  answer: string;
  explanation: string;
}

export interface AiProvider {
  readonly name: string;
  /** 错题个性化讲解；返回 null 表示不可用，回退标准解析 */
  explain(input: AiExplainInput): Promise<string | null>;
  /** AI 变式题生成；返回 null 表示不可用，回退规则变式推荐 */
  generateVariants(input: AiVariantInput): Promise<AiGeneratedQuestion[] | null>;
}

/** MVP：未配置任何 AI Provider */
export function getAiProvider(): AiProvider | null {
  return null;
}
