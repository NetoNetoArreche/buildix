import { prisma } from "@/lib/prisma";
import { getPlanLimits, PLANS } from "@/lib/plans";
import { PlanType } from "@prisma/client";

export type UsageType = "prompts" | "images" | "figmaExports" | "htmlExports";

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  percentUsed: number;
}

export interface UserUsageInfo {
  plan: PlanType;
  prompts: UsageStatus;
  images: UsageStatus;
  figmaExports: UsageStatus;
  htmlExports: UsageStatus;
  periodStart: Date;
  periodEnd: Date;
}

// Get the current billing period (month start to end)
function getCurrentPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// Get or create the current month's usage record for a user
async function getOrCreateCurrentUsage(userId: string) {
  const { start, end } = getCurrentPeriod();

  // Try to find existing usage for this period
  let usage = await prisma.usage.findFirst({
    where: {
      userId,
      periodStart: {
        gte: start,
        lte: end,
      },
    },
  });

  if (!usage) {
    // Create new usage record for this period
    usage = await prisma.usage.create({
      data: {
        userId,
        periodStart: start,
        periodEnd: end,
        promptsUsed: 0,
        imagesGenerated: 0,
        figmaExports: 0,
        htmlExports: 0,
      },
    });
  }

  return usage;
}

// Get user's subscription plan
async function getUserPlan(userId: string): Promise<PlanType> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return "FREE";
  }

  return subscription.plan;
}

// Get complete usage info for a user
export async function getUserUsageInfo(userId: string): Promise<UserUsageInfo> {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getOrCreateCurrentUsage(userId),
  ]);

  const limits = getPlanLimits(plan);
  const { start, end } = getCurrentPeriod();

  const createStatus = (used: number, limit: number): UsageStatus => {
    // -1 significa ilimitado
    const isUnlimited = limit === -1;
    return {
      used,
      limit,
      remaining: isUnlimited ? Infinity : Math.max(0, limit - used),
      isLimitReached: isUnlimited ? false : used >= limit,
      percentUsed: isUnlimited ? 0 : (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100),
    };
  };

  return {
    plan,
    prompts: createStatus(usage.promptsUsed, limits.promptsPerMonth),
    images: createStatus(usage.imagesGenerated, limits.imagesPerMonth),
    figmaExports: createStatus(usage.figmaExports, limits.figmaExportsPerMonth),
    htmlExports: createStatus(usage.htmlExports || 0, limits.htmlExportsPerMonth),
    periodStart: start,
    periodEnd: end,
  };
}

// Check if user can perform an action
export async function canUseFeature(
  userId: string,
  type: UsageType
): Promise<{ allowed: boolean; usage: UsageStatus; plan: PlanType }> {
  const usageInfo = await getUserUsageInfo(userId);

  let usage: UsageStatus;
  switch (type) {
    case "prompts":
      usage = usageInfo.prompts;
      break;
    case "images":
      usage = usageInfo.images;
      break;
    case "figmaExports":
      usage = usageInfo.figmaExports;
      break;
    case "htmlExports":
      usage = usageInfo.htmlExports;
      break;
    default:
      throw new Error(`Unknown usage type: ${type}`);
  }

  return {
    allowed: !usage.isLimitReached,
    usage,
    plan: usageInfo.plan,
  };
}

// Increment usage counter
export async function incrementUsage(
  userId: string,
  type: UsageType,
  amount: number = 1
): Promise<void> {
  const usage = await getOrCreateCurrentUsage(userId);

  const updateData: Record<string, { increment: number }> = {};

  switch (type) {
    case "prompts":
      updateData.promptsUsed = { increment: amount };
      break;
    case "images":
      updateData.imagesGenerated = { increment: amount };
      break;
    case "figmaExports":
      updateData.figmaExports = { increment: amount };
      break;
    case "htmlExports":
      updateData.htmlExports = { increment: amount };
      break;
    default:
      throw new Error(`Unknown usage type: ${type}`);
  }

  await prisma.usage.update({
    where: { id: usage.id },
    data: updateData,
  });
}

// Get usage limit error message
export function getUsageLimitMessage(type: UsageType, plan: PlanType): string {
  const planInfo = PLANS[plan];
  const limits = getPlanLimits(plan);

  const typeLabels: Record<UsageType, string> = {
    prompts: "prompts",
    images: "gerações de imagem",
    figmaExports: "exports para Figma",
    htmlExports: "exports HTML",
  };

  const typeLimit: Record<UsageType, number> = {
    prompts: limits.promptsPerMonth,
    images: limits.imagesPerMonth,
    figmaExports: limits.figmaExportsPerMonth,
    htmlExports: limits.htmlExportsPerMonth,
  };

  const limit = typeLimit[type];

  // Se for ilimitado (-1), não deveria chegar aqui, mas retorna mensagem genérica
  if (limit === -1) {
    return `Uso ilimitado de ${typeLabels[type]} disponível no seu plano ${planInfo.name}.`;
  }

  if (plan === "FREE") {
    return `Você atingiu o limite de ${limit} ${typeLabels[type]} do plano Free. Faça upgrade para continuar criando!`;
  }

  return `Você atingiu o limite de ${limit} ${typeLabels[type]} do plano ${planInfo.name} este mês. Considere fazer upgrade ou aguarde o próximo período.`;
}

// Helper para verificar se um limite é ilimitado
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

// Formatar limite para exibição
export function formatLimit(limit: number): string {
  return limit === -1 ? "Ilimitado" : limit.toString();
}

// Check if user can create a new page in a project
export async function canCreatePage(
  userId: string,
  projectId: string
): Promise<{ allowed: boolean; currentPages: number; limit: number; plan: PlanType; message?: string }> {
  const { prisma: prismaDynamic } = await import("@/lib/prisma");

  const [plan, pageCount] = await Promise.all([
    getUserPlan(userId),
    prismaDynamic.page.count({ where: { projectId } }),
  ]);

  const limits = getPlanLimits(plan);
  const pageLimit = limits.pagesPerProject;

  // -1 means unlimited
  if (pageLimit === -1) {
    return {
      allowed: true,
      currentPages: pageCount,
      limit: pageLimit,
      plan,
    };
  }

  const allowed = pageCount < pageLimit;
  const message = allowed
    ? undefined
    : `Você atingiu o limite de ${pageLimit} páginas por projeto do plano ${PLANS[plan].name}. Faça upgrade para criar mais páginas!`;

  return {
    allowed,
    currentPages: pageCount,
    limit: pageLimit,
    plan,
    message,
  };
}
