"use client";

import { useState, useEffect, useCallback } from "react";
import { PlanType } from "@prisma/client";

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
  periodStart: string;
  periodEnd: string;
}

export interface UseUsageReturn {
  usage: UserUsageInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getWarnings: () => UsageWarning[];
}

export interface UsageWarning {
  type: "prompts" | "images" | "figmaExports" | "htmlExports";
  label: string;
  percentUsed: number;
  remaining: number;
  isLimitReached: boolean;
}

export function useUsage(): UseUsageReturn {
  const [usage, setUsage] = useState<UserUsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/user/usage");
      if (!response.ok) {
        throw new Error("Failed to fetch usage");
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const getWarnings = useCallback((): UsageWarning[] => {
    if (!usage) return [];

    const warnings: UsageWarning[] = [];
    const warningThreshold = 80; // Show warning at 80% usage

    const checkUsage = (
      type: "prompts" | "images" | "figmaExports" | "htmlExports",
      label: string,
      status: UsageStatus
    ) => {
      // Skip if unlimited (-1)
      if (status.limit === -1) return;

      if (status.percentUsed >= warningThreshold || status.isLimitReached) {
        warnings.push({
          type,
          label,
          percentUsed: status.percentUsed,
          remaining: status.remaining,
          isLimitReached: status.isLimitReached,
        });
      }
    };

    checkUsage("prompts", "Prompts AI", usage.prompts);
    checkUsage("images", "Imagens AI", usage.images);
    checkUsage("figmaExports", "Exports Figma", usage.figmaExports);
    checkUsage("htmlExports", "Exports HTML", usage.htmlExports);

    return warnings;
  }, [usage]);

  return {
    usage,
    isLoading,
    error,
    refetch: fetchUsage,
    getWarnings,
  };
}
