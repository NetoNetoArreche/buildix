import { prisma } from "./prisma";

export interface AIConfig {
  enableGemini: boolean;
  enableClaude: boolean;
  defaultAIModel: string;
}

// Cache for AI configuration
let cachedConfig: AIConfig | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

const DEFAULT_CONFIG: AIConfig = {
  enableGemini: true,
  enableClaude: true,
  defaultAIModel: "gemini",
};

/**
 * Get AI configuration with caching
 */
export async function getAIConfig(): Promise<AIConfig> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedConfig && now - cacheTime < CACHE_DURATION) {
    return cachedConfig;
  }

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        enableGemini: true,
        enableClaude: true,
        defaultAIModel: true,
      },
    });

    if (settings) {
      cachedConfig = {
        enableGemini: settings.enableGemini,
        enableClaude: settings.enableClaude,
        defaultAIModel: settings.defaultAIModel,
      };
    } else {
      cachedConfig = DEFAULT_CONFIG;
    }

    cacheTime = now;
    return cachedConfig;
  } catch (error) {
    console.error("Failed to get AI config:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Update AI configuration
 */
export async function updateAIConfig(config: Partial<AIConfig>) {
  // Invalidate cache
  cachedConfig = null;
  cacheTime = 0;

  return prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enableGemini: config.enableGemini ?? true,
      enableClaude: config.enableClaude ?? true,
      defaultAIModel: config.defaultAIModel ?? "gemini",
    },
    update: {
      enableGemini: config.enableGemini,
      enableClaude: config.enableClaude,
      defaultAIModel: config.defaultAIModel,
    },
  });
}

/**
 * Invalidate AI config cache
 */
export function invalidateAIConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}

/**
 * Get list of enabled AI models
 */
export async function getEnabledModels(): Promise<string[]> {
  const config = await getAIConfig();
  const models: string[] = [];

  if (config.enableGemini) models.push("gemini");
  if (config.enableClaude) models.push("claude");

  return models;
}
