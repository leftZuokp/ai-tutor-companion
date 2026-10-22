"use client";

/** 未选择学生档案时的引导卡片 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RequireStudent({ loading }: { loading?: boolean }) {
  return (
    <Card className="mx-auto mt-16 max-w-md border-dashed">
      <CardHeader>
        <CardTitle>{loading ? "正在加载学生档案…" : "请先选择学生档案"}</CardTitle>
        <CardDescription>
          {loading
            ? "正在从本地数据库读取档案列表。"
            : "点击页面右上角「学生档案」选择或新建一个学生，即可开始摸底测评与专项训练。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        本系统以学生档案隔离答题数据，无需注册登录。
      </CardContent>
    </Card>
  );
}
