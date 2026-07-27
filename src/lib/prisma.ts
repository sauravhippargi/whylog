import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 connects through a driver adapter rather than a bundled query
// engine. PrismaPg reads the Supabase Postgres connection from DATABASE_URL.
//
// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting database connections. In production a fresh instance per
// serverless environment is fine.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // The pg driver has no default connection timeout (rules.md §6): without
  // one, a bad connection hangs indefinitely. Cap it, and keep the per-instance
  // pool small since we run on serverless behind the Supabase pooler.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    max: 5,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
