\
# System Context & Role

你是一位资深 Web 全栈开发工程师。请根据以下无 AI 的纯规则化 PRD 规范，协助我从 0 到 1 快速搭建一个轻量级的 K-12 专项练习与错题复盘系统（Next.js 全栈项目）。


---

## 1. 核心功能与实现逻辑（纯规则驱动）


1. **分级专项训练**：

* 按年级（G1-G12）、学科（如数学）、章节/知识点筛选题目。
* 读取数据库中预置的结构化题库，直接展示题目、选项及文字/图片标准解析。


2. **错题本与自动查缺**：

* 学生提交答题卡后，后端自动校验答案，筛选 `is_correct = false` 的记录。
* 自动写入或更新错题表（记录错误频次与最近错误时间），按知识点自动归类。


3. **规则化变式巩固（专项提升）**：

* 用户点击某错题或薄弱知识点的“专项提升”按钮。
* 系统根据错题对应的 `knowledge_id`，在题库中查询同知识点标签、同难度（或±1难度）、且当前用户**未做过**的备用题目进行推荐。


4. **学情统计看板**：

* 基于 SQL 聚合查询展示：总答题数、总体正确率、各科目/知识点错误频次排行榜、已刷题/未刷题进度。


---

## 2. 推荐技术栈

* **Framework**: Next.js 14+ (App Router, React, TypeScript)
* **Styling**: Tailwind CSS + Shadcn UI
* **Database & ORM**: PostgreSQL + Prisma ORM
* **Math Formula Rendering**: KaTeX (用于题目中的数学公式渲染)


---

## 3. 精简版数据库设计 (Prisma Schema)

请按以下简化数据结构配置 `prisma/schema.prisma`：

datasource db { provider = "postgresql" url      = env("DATABASE_URL") }

generator client { provider = "prisma-client-js" }

// 用户表 model User { id           String        @id @default(uuid()) name         String gradeLevel   Int           // 1 - 12 年级 submissions  Submission\[\] errorBooks   ErrorBook\[\] createdAt    DateTime      @default(now()) }

// 知识点表 model KnowledgeNode { id         String      @id // 例: "math_g8_quadratic_01" title      String      // 知识点名称 subject    String      @default("math") grade      Int         // 对应年级 chapter    String      // 对应章节 questions  Question\[\] errorBooks ErrorBook\[\] }

// 题目表 model Question { id          String        @id @default(uuid()) nodeId      String node        KnowledgeNode @relation(fields: \[nodeId\], references: \[id\]) content     String        // 题干 (支持 Markdown/KaTeX) options     Json?         // 选择题选项，非选择题可为空 answer      String        // 标准答案 explanation String        // 标准文字/图片解析 difficulty  Int           @default(1) // 难度系数: 1(易), 2(中), 3(难) submissions Submission\[\] errorBooks  ErrorBook\[\] }

// 答题提交记录表 model Submission { id         String   @id @default(uuid()) userId     String user       User     @relation(fields: \[userId\], references: \[id\]) questionId String question   Question @relation(fields: \[questionId\], references: \[id\]) userAnswer String isCorrect  Boolean createdAt  DateTime @default(now()) }

// 错题本汇总表 model ErrorBook { id           String        @id @default(uuid()) userId       String user         User          @relation(fields: \[userId\], references: \[id\]) questionId   String question     Question      @relation(fields: \[questionId\], references: \[id\]) nodeId       String node         KnowledgeNode @relation(fields: \[nodeId\], references: \[id\]) errorCount   Int           @default(1)  // 累计做错次数 isResolved   Boolean       @default(false) // 是否已掌握/标记解决 lastFailedAt DateTime      @default(now())

@@unique(\[userId, questionId\]) }


---

## 4. 核心服务接口实现逻辑参考

### 4.1 提交答题卡与错题自动收集 (`/api/submissions`)

```typescript
// 提交逻辑伪代码说明：
// 1. 遍历提交的答题数组：对每道题比对 userAnswer === question.answer，确定 isCorrect。
// 2. 插入 Submission 记录。
// 3. 若 isCorrect === false：
//    使用 prisma.errorBook.upsert()，若存在该错题则 errorCount + 1 并更新 lastFailedAt，不存在则创建新错题记录。
```

### 4.2 规则化变式巩固推荐 (`/api/recommendations`)

```typescript
// 变式推荐逻辑伪代码说明：
// 输入：userId, targetNodeId, targetDifficulty
// 1. 查询该用户针对该节点已做过的题目 ID 列表：
//    const doneIds = await prisma.submission.findMany({ where: { userId }, select: { questionId: true } });
// 2. 查询同知识点、同难度、且不在 doneIds 中的题目：
//    const candidates = await prisma.question.findMany({
//      where: {
//        nodeId: targetNodeId,
//        difficulty: targetDifficulty,
//        id: { notIn: doneIds.map(d => d.questionId) }
//      },
//      take: 5 // 推荐 5 道变式题
//    });
```

### 4.3 学情统计看板 (`/api/dashboard`)

```typescript
// SQL 聚合查询逻辑伪代码说明：
// 1. 总答题数与正确率：
//    COUNT(id) as total, SUM(CASE WHEN isCorrect THEN 1 ELSE 0 END) as correctCount
// 2. 薄弱知识点排行榜：
//    GROUP BY nodeId，按 count(isCorrect = false) 倒序排列，列出错误频率最高的前 5 个知识点。
```


---

## 5. 分步开发任务指令（请 Claude Code 按顺序执行）

请按以下步骤依次完成项目开发：


1. **步骤 1：构建项目与 Prisma**

* 创建 Next.js 14 App Router 项目并配置 Tailwind CSS。
* 初始化 Prisma Schema（使用上面提供的精简 Schema），并生成 `prisma/seed.ts` 插入 3-5 个测试知识点和 10 道测试题目。


2. **步骤 2：前端练习界面与答题提交**

* 搭建“分级专项训练”页面：支持按年级/知识点筛选题目，展示题干、选项及提交按钮。
* 提交后自动核对答案，展示正确/错误状态及标准解析。后端自动记录错题。


3. **步骤 3：错题本与变式巩固**

* 搭建“错题本”页面：展示已收集的错题，支持按知识点折叠与筛选。
* 添加“专项提升”按钮：点击后调用推荐接口，自动调取同知识点、同难度的未做备用题形成强化练习组。


4. **步骤 4：学情统计看板**

* 搭建“学情看板”页面：使用 Chart.js / Recharts 或 Shadcn UI 展示答题正确率、做题总数以及薄弱知识点排行榜。

请首先为我生成项目目录结构，并输出 `prisma/schema.prisma` 与 `prisma/seed.ts` 示例代码。

\
