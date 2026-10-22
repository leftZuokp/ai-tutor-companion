import { NextRequest, NextResponse } from "next/server";
import { getMasteryStats } from "@/lib/services/mastery";


/** 知识点掌握度（红黄绿）：GET ?userId=&grade=&subject= */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const userId = params.get("userId");
  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

  const grade = Number(params.get("grade"));
  const subject = params.get("subject") ?? undefined;

  const stats = await getMasteryStats(userId, {
    ...(Number.isInteger(grade) ? { grade } : {}),
    ...(subject ? { subject } : {}),
  });
  return NextResponse.json({ stats });
}
