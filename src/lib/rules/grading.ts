/**
 * 判题规则
 * - 单选题：选项字母精确匹配
 * - 填空题：标准化后匹配（去空白、全角转半角、忽略大小写、去末尾句号/单位"度"）
 */

export function normalizeFillAnswer(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, "") // 去所有空白
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)) // 全角→半角
    .replace(/。$/, "")
    .replace(/(度|°)$/, "")
    .toLowerCase();
}

export function gradeAnswer(
  question: { type: string; answer: string },
  userAnswer: string,
): boolean {
  if (!userAnswer) return false;
  if (question.type === "fill_in") {
    return normalizeFillAnswer(userAnswer) === normalizeFillAnswer(question.answer);
  }
  return userAnswer.trim() === question.answer.trim();
}
