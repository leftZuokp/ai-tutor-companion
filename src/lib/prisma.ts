import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * SQLite 路径解析：Prisma CLI 将 file:./xxx 解析到 schema 所在的 prisma/ 目录，
 * 而运行时（next dev/start）按进程 CWD 解析。这里统一改写为基于项目根的绝对路径，
 * 保证两端指向同一个库文件。
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:")) return url;
  const rel = url.slice("file:".length);
  if (path.isAbsolute(rel)) return url;
  return `file:${path.join(process.cwd(), "prisma", rel)}`;
}

// 全局单例，避免 Next.js 开发模式热重载时重复创建连接池
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  // 未配置 DATABASE_URL（如构建期收集页面数据）时不传覆盖值，
  // 交给 Prisma 在真正查询时再解析 schema 中的 env("DATABASE_URL")
  return url ? new PrismaClient({ datasources: { db: { url } } }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
