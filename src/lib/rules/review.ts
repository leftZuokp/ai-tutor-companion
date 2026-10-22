/**
 * 错题定时复习规则（艾宾浩斯简版，PRD 3.3）
 *
 * 错题产生后按 第 1 天 → 第 3 天 → 第 7 天 三个节点安排复习：
 * - 复习答对：推进到下一节点；第 7 天节点答对则标记 isResolved（通关）
 * - 复习答错：累计错误次数 +1，重置回第 1 天节点
 */

/** 各复习阶段对应的提醒间隔（天），stage 为数组下标 */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7] as const;

export const MAX_REVIEW_STAGE = REVIEW_INTERVAL_DAYS.length - 1;

/** 通关后的错题不再提醒，nextReviewDate 置到遥远未来以保持语义完整 */
export const RESOLVED_NEXT_REVIEW = () => addDays(new Date(), 365);

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** 产生新错题（或再次做错）时的复习计划 */
export function scheduleForNewFailure(now = new Date()) {
  return {
    reviewStage: 0,
    nextReviewDate: addDays(now, REVIEW_INTERVAL_DAYS[0]),
    isResolved: false,
  };
}

/**
 * 复习答对后的推进计划。
 * @param currentStage 当前所处阶段（即刚刚完成的节点）
 */
export function scheduleAfterSuccess(currentStage: number, now = new Date()) {
  if (currentStage >= MAX_REVIEW_STAGE) {
    return { reviewStage: currentStage, isResolved: true, nextReviewDate: RESOLVED_NEXT_REVIEW() };
  }
  const nextStage = currentStage + 1;
  return {
    reviewStage: nextStage,
    isResolved: false,
    nextReviewDate: addDays(now, REVIEW_INTERVAL_DAYS[nextStage]),
  };
}

/** 当天到期的判断（只比较日期，不含时分秒） */
export function isDueToday(nextReviewDate: Date, today = new Date()): boolean {
  const due = new Date(nextReviewDate);
  due.setHours(0, 0, 0, 0);
  const day = new Date(today);
  day.setHours(0, 0, 0, 0);
  return due.getTime() <= day.getTime();
}

export function reviewStageLabel(stage: number): string {
  return `第 ${REVIEW_INTERVAL_DAYS[stage]} 天节点`;
}
