# 智学伴读 · AI 智能私人家教伴读系统

规则驱动型 K-12 专项练习与错题复盘系统。基于"知识点标签 + 答题数据统计 + FSRS-5 记忆算法"实现
**摸底测评 → 诊断 → 巩固 → 反馈** 的自适应学习闭环。

产品规划见 [私人家教产品PRD规划.pdf](./私人家教产品PRD规划.pdf)（完整版）、[私人家教-PRD.md](./私人家教-PRD.md)（MVP 版）。

## 核心功能

| 模块 | 说明 | 实现逻辑 |
| --- | --- | --- |
| 摸底测评 | 按年级组卷，覆盖全部知识点；**四能力维度均衡抽题**（概念理解/逻辑推演/运算准确/综合应用） | 维度缺口优先 + 难度居中排序组卷，交卷生成红黄绿报告与四维得分 |
| 前置依赖穿透 | 红色知识点沿知识拓扑**跨年级追溯根因**（如"因式分解薄弱"→ 定位 G7"整式加减"缺陷） | 知识点 prerequisites 闭包 BFS + 掌握度判定 |
| 分级专项训练 | 年级 → 章节/知识点，附 **LibreMath 结构化知识卡片**（适用前提/正例/反例/易错点）与思想方法标签；支持难度/题型筛选 | 结构化题库 + KaTeX 渲染 |
| 三级分步提示 | 答错后先"条件梳理 → 方法联想"再揭示完整解析，杜绝直接看解析（苏格拉底式引导的规则化实现） | 题目 hints 字段渐进揭示 |
| 规则化变式巩固 | "专项提升"推送同知识点、同难度（±1）、未做过的变式题 | 排除已做题目 ID 的推荐算法 |
| 错题本与四类归因 | 错题自动归档；按 **概念模糊/逻辑断层/计算失误/审题偏差** 归因打标并统计分布 | ErrorBook.attribution + 归因接口 |
| FSRS-5 记忆复习 | 替代固定 1/3/7 天：DSR 三维记忆模型动态拟合遗忘曲线，目标保留率 0.9；复习自评四档（重来/困难/良好/简单）；展示可检索性 | ts-fsrs 开源算法 + FsrsLog 复习日志 |
| 学情统计看板 | 总答题数、正确率、近 14 天趋势、章节正确率、薄弱知识点 Top5、知识图谱、归因分布 | 聚合查询 + Recharts |

### 掌握度判定规则（红 / 黄 / 绿）

- **红（未掌握）**：近 5 题正确率 < 60%，或最近连续做错 2 题
- **黄（巩固中）**：近 5 题正确率 60% ~ 80%
- **绿（已掌握）**：最近连续做对 3 题，或近 5 题正确率 ≥ 80%
- 灰（未接触）：该知识点无答题记录

## 技术栈

- **框架**：Next.js 16（App Router + TypeScript strict）
- **UI**：Tailwind CSS 4 + shadcn/ui（"纸墨学堂"主题：宣纸底色、墨蓝主色、朱砂/金黄/青玉三色掌握度体系）
- **数据**：Prisma + SQLite（零配置，`prisma/dev.db`；schema 兼容 PostgreSQL，迁移成本低）
- **记忆算法**：[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（FSRS-5 开源实现）
- **公式**：KaTeX（题干/选项/解析支持 `$...$` 行内与 `$$...$$` 块级公式）
- **图表**：Recharts

## 题库现状

数学 G5~G9 共 **24 个知识点 / 119 道题**（每题含能力维度标签与三级分步提示，每知识点含结构化知识卡片、前置依赖、思想方法标签）：

| 年级 | 知识点 |
| --- | --- |
| 五年级 | 分数的意义与加减运算 / 简易方程 / 多边形的面积 |
| 六年级 | 百分数与应用 / 圆的周长与面积 / 比与比例 |
| 七年级 | 有理数（数轴与运算）/ 整式加减 / 一元一次方程（求解与应用）/ 角度计算 |
| 八年级 | 三角形 / 全等三角形 / 整式乘法与因式分解 / 分式 / 二次根式 / 勾股定理 / 一次函数 |
| 九年级 | 一元二次方程 / 二次函数 / 相似三角形 / 圆的基本性质 / 概率初步 |

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

## 产品路线图（对照 PRD）

**已落地（无 LLM 依赖，PRD 阶段一 + 阶段三核心）**：

- ✅ K-12 分级知识图谱（G5~G9，含前置依赖与思想方法）
- ✅ 分级摸底测评 + 红黄绿图谱 + 四能力维度得分 + 前置依赖穿透
- ✅ 三级分步提示（苏格拉底式引导的规则化实现）
- ✅ 多维错题归因（四类标签与统计）
- ✅ FSRS-5 自适应间隔复习（ts-fsrs，目标保留率 0.9，四档自评，复习日志）
- ✅ Docker 部署与 CI

**二期（需接入大模型，`src/lib/ai/provider.ts` 已预留扩展点）**：

- 苏格拉底 AI 伴读对话（强制问句结尾、限 150 字、严禁直出答案）
- 费曼小老师表达评分（表达清晰度/逻辑完备性/术语简化度三维度）
- AI 三阶变式题生成（参数变式 / 情境变式 / 逆向变式）
- 拍照收题 OCR 与自动知识点绑定
- 家长端协同看板与学习周报

## 二期规划：接入 AI（预留扩展点）

MVP 为纯规则驱动，未调用任何大模型。`src/lib/ai/provider.ts` 定义了 `AiProvider`
接口（错题个性化讲解 `explain`、AI 变式题生成 `generateVariants`）。接入 GLM / OpenAI
等模型时，只需实现该接口并在 `getAiProvider()` 返回实现——业务侧已按"未配置时回退
标准解析 / 规则推荐"设计，无需改动调用点。
