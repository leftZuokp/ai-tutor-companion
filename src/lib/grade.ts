/** 年级显示工具 */
const GRADE_NAMES = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "七年级", "八年级", "九年级", "高一", "高二", "高三",
];

export function gradeLabel(gradeLevel: number): string {
  return GRADE_NAMES[gradeLevel - 1] ?? `${gradeLevel} 年级`;
}
