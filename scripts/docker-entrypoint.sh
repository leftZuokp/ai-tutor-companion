#!/bin/sh
# 容器启动脚本：迁移数据库 -> 同步种子题库(幂等) -> 启动应用
set -e

echo "==> 应用数据库迁移..."
npx prisma migrate deploy

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "==> 同步种子题库（幂等 upsert）..."
  npm run db:seed
fi

echo "==> 启动应用（端口 3000）..."
exec npx next start -H 0.0.0.0 -p 3000
