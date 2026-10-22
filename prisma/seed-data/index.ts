import { G5_NODES } from "./g5";
import { G6_NODES } from "./g6";
import { G7_NODES } from "./g7";
import { G8_NODES } from "./g8";
import { G8_EXTRA_NODES } from "./g8-extra";
import { G9_NODES } from "./g9";
import { G9_EXTRA_NODES } from "./g9-extra";
import type { SeedNode } from "./types";

/** 全量知识点数据：G5~G9，24 个知识点（按年级、章节排序） */
export const ALL_NODES: SeedNode[] = [
  ...G5_NODES,
  ...G6_NODES,
  ...G7_NODES,
  ...G8_NODES,
  ...G8_EXTRA_NODES,
  ...G9_NODES,
  ...G9_EXTRA_NODES,
];
