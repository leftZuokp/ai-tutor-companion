import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StudentDTO } from "@/lib/types";


/** 学生档案列表 */
export async function GET() {
  const students = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const dto: StudentDTO[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel,
    createdAt: s.createdAt.toISOString(),
  }));
  return NextResponse.json(dto);
}

/** 创建学生档案 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const gradeLevel = Number(body?.gradeLevel);

  if (!name) return NextResponse.json({ error: "学生姓名不能为空" }, { status: 400 });
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
    return NextResponse.json({ error: "年级必须为 1-12 的整数" }, { status: 400 });
  }

  const student = await prisma.user.create({ data: { name, gradeLevel } });
  return NextResponse.json(
    {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      createdAt: student.createdAt.toISOString(),
    } satisfies StudentDTO,
    { status: 201 },
  );
}
