# 智学伴读 · AI 智能私人家教伴读系统

规则驱动型 K-12 专项练习与错题复盘系统（MVP）。基于"知识点标签 + 答题数据统计"实现
**摸底测评 → 诊断 → 巩固 → 反馈** 的自适应学习闭环，全程无需调用任何 AI API。

产品规划见 [私人家教-PRD.md](./私人家教-PRD.md) 与 [AI 智能私人家教伴读系统.md](./AI%20智能私人家教伴读系统.md)。

## 核心功能

| 模块 | 说明 | 实现逻辑 |
| --- | --- | --- |
| 摸底测评 | 按年级组卷，覆盖全部知识点，交卷生成红黄绿诊断报告 | 每知识点抽 2~4 题，交卷后由掌握度规则引擎出报告 |
| 分级专项训练 | 年级 → 学科 → 章节/知识点 级联选题，逐题即时判题与解析 | 读取结构化题库，KaTeX 渲染公式 |
| 错题本与自动查缺 | 做错自动归档，按知识点分组，展示错误频次与复习计划 | 答题后 upsert 错题表（`errorCount`、`nextReviewDate`） |
| 规则化变式巩固 | "专项提升"推送同知识点、同难度（±1）、未做过的变式题 | 排除已做题目 ID，同难度优先、不足时扩展难度 |
| 艾宾浩斯复习 | 错题按第 1 / 3 / 7 天提醒重做；答对推进、答错重置 | 首页/复习页拉取 `nextReviewDate <= 今天` 的错题 |
| 学情统计看板 | 总答题数、正确率、近 14 天趋势、章节正确率、薄弱知识点 Top5、知识图谱 | SQL/内存聚合 + Recharts 可视化 |

### 掌握度判定规则（红 / 黄 / 绿）

- **红（未掌握）**：近 5 题正确率 < 60%，或最近连续做错 2 题
- **黄（巩固中）**：近 5 题正确率 60% ~ 80%
- **绿（已掌握）**：最近连续做对 3 题，或近 5 题正确率 ≥ 80%
- 灰（未接触）：该知识点无答题记录

## 技术栈

- **框架**：Next.js 16（App Router + TypeScript strict）
- **UI**：Tailwind CSS 4 + shadcn/ui（"纸墨学堂"主题：宣纸底色、墨蓝主色、朱砂/金黄/青玉三色掌握度体系）
- **数据**：Prisma + SQLite（零配置，`prisma/dev.db`；schema 兼容 PostgreSQL，迁移成本低）
- **公式**：KaTeX（题干/选项/解析支持 `$...$` 行内与 `$$...$$` 块级公式）
- **图表**：Recharts

## 快速开始

```bash
npm install
npm run db:migrate   # 初始化 SQLite 并应用迁移
npm run db:seed      # 写入种子题库：G7~G9 数学 11 个知识点、54 道题
npm run dev          # http://localhost:3000
```

打开首页后，点击右上角「新建档案」创建学生（如：小明 · 七年级），即可开始摸底测评。

其他命令：

```bash
npm run build        # 生产构建
npm run db:studio    # Prisma Studio 查看数据库
```

## 项目结构

```
prisma/                  # schema + 种子题库
src/
├── app/
│   ├── page.tsx         # 首页：概览 + 今日复习 + 薄弱点速览
│   ├── assessment/      # 摸底测评（组卷 → 答卷 → 诊断报告）
│   ├── practice/        # 分级专项训练 / reinforce 变式巩固
│   ├── mistakes/        # 错题本（按知识点折叠分组）
│   ├── review/          # 今日复习（艾宾浩斯到期错题）
│   ├── dashboard/       # 学情看板（图表 + 知识图谱）
│   └── api/             # 9 个 Route Handler
├── components/          # QuestionRunner / MathText / MasteryBadge / NavBar 等
└── lib/
    ├── rules/           # 规则引擎：mastery 掌握度 / review 艾宾浩斯 / grading 判题
    ├── services/        # submissions 判题入库 / mastery 统计
    ├── ai/provider.ts   # AI 扩展点（二期接入大模型）
    └── student-context  # 学生档案上下文（localStorage 记忆）
```

## 部署到公网（云服务器 + Docker）

项目自带容器化部署物料：`Dockerfile`、`docker-compose.yml`、`Caddyfile`（自动 HTTPS）、
`scripts/docker-entrypoint.sh`（启动时自动迁移 + 幂等同步题库）。已在本地完成构建与容器冒烟验证
（含数据卷持久化：销毁重建容器数据不丢）。

```bash
# 服务器安装 Docker 后，三步上线：
docker compose up -d --build                                  # 仅应用，HTTP :3000
DOMAIN=your-domain.com docker compose --profile web up -d --build   # 应用 + Caddy 自动 HTTPS

# 数据备份 = 备份 ./data 目录（SQLite 全部数据）
```

注意事项：

- 首次部署前将域名 A 记录解析到服务器公网 IP；国内服务器需 ICP 备案
- 服务器为 x86 架构时，在 Mac（M 系列）上构建需加 `--platform linux/amd64`
- `.env`、`dev.db`、`src/generated`、`data/` 均不入库/不入镜像（见 `.gitignore` / `.dockerignore`）
- 若后续要免运维托管（Vercel 等 Serverless 平台），需将 `schema.prisma` 的 provider 换为
  `postgresql` 并重新迁移——数据模型与业务代码零改动

## 团队协作开发

- **新人初始化**：`git clone` → `npm install` → `cp .env.example .env` → `npm run db:migrate && npm run db:seed` → `npm run dev`
- **分支规范**：`main` 受保护，功能走 `feature/xxx` 分支 + PR 评审；提交信息用 `feat:/fix:/refactor:` 中文前缀
- **CI**：`.github/workflows/ci.yml` 在 push/PR 时自动执行 `prisma generate → lint → next build`（含 TypeScript strict 检查）
- **Schema 变更纪律**：改表必须用 `npx prisma migrate dev --name xxx` 生成迁移文件提交入库，同事拉取后执行 `npx prisma migrate deploy` 同步本地库；种子脚本幂等可重复执行
- **环境约定**：本地开发 Node 24+（lockfile 由 npm 11.19 生成，低版本 npm 执行 `npm ci` 可能报 optional 依赖缺失）

## 二期规划：接入 AI（预留扩展点）

MVP 为纯规则驱动，未调用任何大模型。`src/lib/ai/provider.ts` 定义了 `AiProvider`
接口（错题个性化讲解 `explain`、AI 变式题生成 `generateVariants`）。接入 GLM / OpenAI
等模型时，只需实现该接口并在 `getAiProvider()` 返回实现——业务侧已按"未配置时回退
标准解析 / 规则推荐"设计，无需改动调用点。
