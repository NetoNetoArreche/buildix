import { prisma } from "@/lib/prisma";

// Cache em memória para evitar consultas frequentes ao banco
let maintenanceCache: {
  enabled: boolean;
  title: string;
  message: string;
  timestamp: number;
} | null = null;

const CACHE_TTL = 30 * 1000; // 30 segundos

export interface MaintenanceStatus {
  enabled: boolean;
  title: string;
  message: string;
}

/**
 * Verifica se o modo manutenção está ativo
 * Usa cache em memória para performance
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  // Verifica cache
  if (maintenanceCache && Date.now() - maintenanceCache.timestamp < CACHE_TTL) {
    return {
      enabled: maintenanceCache.enabled,
      title: maintenanceCache.title,
      message: maintenanceCache.message,
    };
  }

  try {
    // Busca do banco
    const settings = await prisma.siteSettings.findFirst({
      where: { id: "default" },
    });

    const status = {
      enabled: settings?.maintenanceMode ?? false,
      title: settings?.maintenanceTitle ?? "BuildixLab",
      message: settings?.maintenanceMessage ?? "Em breve estará disponível",
    };

    // Atualiza cache
    maintenanceCache = {
      ...status,
      timestamp: Date.now(),
    };

    return status;
  } catch (error) {
    console.error("[Maintenance] Error checking status:", error);
    // Em caso de erro, assume que não está em manutenção
    return {
      enabled: false,
      title: "BuildixLab",
      message: "Em breve estará disponível",
    };
  }
}

/**
 * Verifica apenas se o modo manutenção está ativo (versão simplificada)
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const status = await getMaintenanceStatus();
  return status.enabled;
}

/**
 * Invalida o cache de manutenção (chamar após toggle)
 */
export function invalidateMaintenanceCache(): void {
  maintenanceCache = null;
}

/**
 * Atualiza as configurações de manutenção
 */
export async function updateMaintenanceSettings(
  enabled: boolean,
  title?: string,
  message?: string,
  updatedBy?: string
): Promise<MaintenanceStatus> {
  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {
        maintenanceMode: enabled,
        ...(title !== undefined && { maintenanceTitle: title }),
        ...(message !== undefined && { maintenanceMessage: message }),
        updatedBy,
      },
      create: {
        id: "default",
        maintenanceMode: enabled,
        maintenanceTitle: title ?? "BuildixLab",
        maintenanceMessage: message ?? "Em breve estará disponível",
        updatedBy,
      },
    });

    // Invalida o cache após atualização
    invalidateMaintenanceCache();

    return {
      enabled: settings.maintenanceMode,
      title: settings.maintenanceTitle ?? "BuildixLab",
      message: settings.maintenanceMessage ?? "Em breve estará disponível",
    };
  } catch (error) {
    console.error("[Maintenance] Error updating settings:", error);
    throw error;
  }
}
