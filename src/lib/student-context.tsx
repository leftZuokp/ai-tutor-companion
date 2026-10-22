"use client";

/**
 * 学生档案上下文：MVP 无登录体系，以"档案选择"隔离数据。
 * 当前学生在 localStorage 中记忆，刷新与跨页保持。
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { StudentDTO } from "@/lib/types";

const STORAGE_KEY = "tutor.currentStudentId";

interface StudentContextValue {
  students: StudentDTO[] | null; // null 表示加载中
  current: StudentDTO | null;
  setCurrentId: (id: string) => void;
  createStudent: (name: string, gradeLevel: number) => Promise<StudentDTO>;
  refresh: () => void;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<StudentDTO[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetch("/api/students")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load failed"))))
      .then((list: StudentDTO[]) => {
        setStudents(list);
        setCurrentId((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev;
          const stored =
            typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
          if (stored && list.some((s) => s.id === stored)) return stored;
          return list[0]?.id ?? null;
        });
      })
      .catch(() => {
        // 加载失败时保持现状，页面按无档案引导处理
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setCurrentIdAndStore = useCallback((id: string) => {
    setCurrentId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const createStudent = useCallback(
    async (name: string, gradeLevel: number) => {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gradeLevel }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "创建学生档案失败");
      }
      const student: StudentDTO = await res.json();
      window.localStorage.setItem(STORAGE_KEY, student.id);
      setCurrentId(student.id);
      refresh();
      return student;
    },
    [refresh],
  );

  const current = students?.find((s) => s.id === currentId) ?? null;

  return (
    <StudentContext.Provider
      value={{ students, current, setCurrentId: setCurrentIdAndStore, createStudent, refresh }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent(): StudentContextValue {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent 必须在 StudentProvider 内使用");
  return ctx;
}
