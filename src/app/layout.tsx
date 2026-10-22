import type { Metadata } from "next";
import "./globals.css";
import { StudentProvider } from "@/lib/student-context";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "智学伴读 · AI 智能私人家教",
  description: "规则驱动的 K12 专项练习与错题复盘系统：摸底测评、变式巩固、艾宾浩斯复习、学情看板",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <StudentProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">{children}</main>
          <footer className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
            智学伴读 · 规则驱动型智能家教 · 测试 → 诊断 → 巩固 → 反馈
          </footer>
        </StudentProvider>
      </body>
    </html>
  );
}
