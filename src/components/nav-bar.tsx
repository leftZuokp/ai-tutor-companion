"use client";

/** 顶部导航：品牌印章 + 模块入口 + 学生档案切换 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gradeLabel } from "@/lib/grade";
import { useStudent } from "@/lib/student-context";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/assessment", label: "摸底测评" },
  { href: "/practice", label: "专项训练" },
  { href: "/mistakes", label: "错题本" },
  { href: "/review", label: "今日复习" },
  { href: "/dashboard", label: "学情看板" },
];

export function NavBar() {
  const pathname = usePathname();
  const { students, current, setCurrentId, createStudent } = useStudent();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      await createStudent(name.trim(), Number(grade));
      setName("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="seal size-8 text-[13px]">智学</span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-wide">智学伴读</span>
            <span className="text-[10px] text-muted-foreground">私人家教伴读系统</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-sm">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 transition-colors hover:bg-muted hover:text-foreground",
                  active ? "bg-muted font-medium text-primary" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Select value={current?.id ?? ""} onValueChange={setCurrentId}>
            <SelectTrigger className="h-8 w-36 gap-1 text-xs" aria-label="切换学生档案">
              <SelectValue placeholder={students === null ? "加载中…" : "选择学生"} />
            </SelectTrigger>
            <SelectContent>
              {(students ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {gradeLabel(s.gradeLevel)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">新建档案</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-display">新建学生档案</DialogTitle>
                <DialogDescription>创建后即可开始摸底测评，系统将按档案隔离答题数据。</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="student-name">姓名</Label>
                  <Input
                    id="student-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：小明"
                    maxLength={20}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>年级</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                        <SelectItem key={g} value={String(g)}>{gradeLabel(g)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                  {creating ? "创建中…" : "创建档案"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
