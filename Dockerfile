# ---------- 构建阶段 ----------
# 与本地开发 Node 24 保持一致（npm 大版本不同会导致 lockfile 可选依赖校验失败）
FROM node:24-alpine AS builder
WORKDIR /app

# Prisma 引擎在 Alpine 上依赖 openssl
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# 先生成 Prisma Client（利用 Docker 层缓存，源码变动时不重装依赖）
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
# 构建期收集页面数据会实例化 PrismaClient，需要可用的连接串占位
ENV DATABASE_URL="file:/app/data/tutor.db"
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

# prisma CLI 与 tsx 已放在 dependencies，运行期可执行迁移与种子同步
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 构建产物：完整 .next（next start 运行）+ 静态资源 + Prisma schema/迁移 + 生成的客户端
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh

# 数据库文件存放目录（compose 挂载持久卷）
RUN mkdir -p /app/data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/students >/dev/null || exit 1

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
