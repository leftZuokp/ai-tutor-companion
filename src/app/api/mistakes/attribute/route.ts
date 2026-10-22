import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ATTRIBUTIONS = ["concept_vague", "logic_gap", "calc_error", "misread"];

/**
 * 错题归因打标（PRD 3.4.1 多维错题归因）：
 * POST { errorBookId, attribution: concept_vague|logic_gap|calc_error|misread }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const errorBookId = typeof body?.errorBookId === "string" ? body.errorBookId : "";
  const attribution = typeof body?.attribution === "string" ? body.attribution : "";

  if (!errorBookId) return NextResponse.json({ error: "缺少 errorBookId" }, { status: 400 });
  if (!ATTRIBUTIONS.includes(attribution)) {
    return NextResponse.json({ error: "attribution 取值非法" }, { status: 400 });
  }

  const updated = await prisma.errorBook.update({
    where: { id: errorBookId },
    data: { attribution },
    select: { id: true, attribution: true },
  });
  return NextResponse.json(updated);
}
