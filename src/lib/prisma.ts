import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Force correct DATABASE_URL for development (Windows system env var override fix)
const getDatabaseUrl = () => {
  // Always prefer the production URL for buildix project
  const envUrl = process.env.DATABASE_URL;
  // If running locally and URL points to wrong database, use the correct one
  if (envUrl?.includes("localhost:5432/ai_web_builder")) {
    return "postgresql://postgres:Taboao@92.113.32.80:5432/buildix?schema=public";
  }
  return envUrl;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
