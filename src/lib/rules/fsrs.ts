/**
 * FSRS-5 记忆引擎（PRD 4.1）
 *
 * 采用开源 ts-fsrs 实现 DSR 三维记忆模型（难度 Difficulty / 稳定性 Stability / 可检索性 Retrievability），
 * 替代原固定 1/3/7 天艾宾浩斯节奏：
 * - 目标保留率默认 0.9（可按备考/日常场景调整）
 * - 复习评分 1-4：重来 Again / 困难 Hard / 良好 Good / 简单 Easy
 * - 到期判定：due <= 当前时刻；答错强制按"重来"调度
 * - "通关"判定：复习间隔拉到 21 天以上（记忆已足够稳定）
 */
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type Grade,
} from "ts-fsrs";

export const TARGET_RETENTION = 0.9;
export const RESOLVED_INTERVAL_DAYS = 21;

const scheduler = fsrs(
  generatorParameters({ request_retention: TARGET_RETENTION, enable_fuzz: true }),
);

export type ReviewRating = 1 | 2 | 3 | 4;

export const RATING_LABELS: Record<ReviewRating, string> = {
  1: "重来",
  2: "困难",
  3: "良好",
  4: "简单",
};

/** 序列化后的 FSRS 记忆状态（存 ErrorBook.fsrsState） */
export interface FsrsState {
  due: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  lastReview: string | null;
  state: number;
}

function reviveCard(s: FsrsState): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: 0,
    scheduled_days: s.scheduledDays,
    learning_steps: s.learningSteps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    ...(s.lastReview ? { last_review: new Date(s.lastReview) } : {}),
  };
}

function serializeCard(card: Card): FsrsState {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    lastReview: card.last_review ? card.last_review.toISOString() : null,
    state: card.state,
  };
}

/** 新错题的初始记忆状态（当天即到期，进入复习队列） */
export function newCardState(now = new Date()): FsrsState {
  return serializeCard(createEmptyCard(now));
}

/**
 * 以给定评分调度一次复习，返回新记忆状态。
 * @param state 既有状态；null 视为新卡
 */
export function scheduleReview(
  state: FsrsState | null,
  rating: ReviewRating,
  now = new Date(),
): FsrsState {
  const card = state ? reviveCard(state) : createEmptyCard(now);
  const next = scheduler.next(card, now, rating as Grade);
  return serializeCard(next.card);
}

/** 当前可检索性（0-1）：成功回忆起的概率，随时间衰减 */
export function retrievability(state: FsrsState, now = new Date()): number {
  const card = reviveCard(state);
  const r = scheduler.get_retrievability(card, now, false);
  return typeof r === "number" ? r : Number(r ?? 0);
}

/** 是否到期需要复习 */
export function isDue(state: FsrsState | null, now = new Date()): boolean {
  if (!state) return true;
  return new Date(state.due).getTime() <= now.getTime();
}

/** 记忆是否已足够稳定（复习间隔 ≥ 21 天），视为通关 */
export function isResolvedState(state: FsrsState): boolean {
  return state.scheduledDays >= RESOLVED_INTERVAL_DAYS;
}

export function parseState(raw: string | null | undefined): FsrsState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FsrsState;
  } catch {
    return null;
  }
}
