"use client";

/**
 * 数学公式混排渲染：把包含 $...$（行内）与 $$...$$（块级）的文本切分后交给 KaTeX。
 * 普通文本段做 HTML 转义，防止注入。
 */
import katex from "katex";
import { useMemo } from "react";

type Segment = { kind: "text" | "inline" | "block"; source: string };

const FORMULA_PATTERN = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of raw.matchAll(FORMULA_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ kind: "text", source: raw.slice(lastIndex, index) });
    if (match[1] !== undefined) segments.push({ kind: "block", source: match[1] });
    else segments.push({ kind: "inline", source: match[2] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < raw.length) segments.push({ kind: "text", source: raw.slice(lastIndex) });
  return segments;
}

function renderSegment(segment: Segment): string {
  if (segment.kind === "text") return escapeHtml(segment.source);
  try {
    return katex.renderToString(segment.source, {
      displayMode: segment.kind === "block",
      throwOnError: false,
      strict: false,
    });
  } catch {
    return escapeHtml(segment.source);
  }
}

export function MathText({ content, className }: { content: string; className?: string }) {
  const html = useMemo(
    () => parseSegments(content).map(renderSegment).join(""),
    [content],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
