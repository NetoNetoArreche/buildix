"use client";

import { AlertTriangle, X, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUsage, UsageWarning } from "@/hooks/useUsage";
import { cn } from "@/lib/utils";

export function UsageWarningBanner() {
  const { usage, getWarnings, isLoading } = useUsage();
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (isLoading || !usage) return null;

  const warnings = getWarnings().filter(
    (w) => !dismissed.includes(w.type)
  );

  if (warnings.length === 0) return null;

  // Get the most critical warning (highest percentage or limit reached)
  const criticalWarning = warnings.reduce((prev, curr) => {
    if (curr.isLimitReached && !prev.isLimitReached) return curr;
    if (!curr.isLimitReached && prev.isLimitReached) return prev;
    return curr.percentUsed > prev.percentUsed ? curr : prev;
  });

  const isCritical = criticalWarning.isLimitReached;
  const isWarning = criticalWarning.percentUsed >= 80 && !isCritical;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-1.5 text-xs",
        isCritical && "bg-destructive/10 text-destructive border-b border-destructive/20",
        isWarning && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-b border-amber-500/20"
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>
          {isCritical ? (
            <>
              <strong>{criticalWarning.label}:</strong> Limite atingido!
            </>
          ) : (
            <>
              <strong>{criticalWarning.label}:</strong> {criticalWarning.percentUsed}% usado
              ({criticalWarning.remaining} restantes)
            </>
          )}
        </span>
        {warnings.length > 1 && (
          <span className="text-muted-foreground">
            +{warnings.length - 1} outros
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/pricing">
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs">
            <Zap className="h-3 w-3" />
            Fazer Upgrade
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setDismissed([...dismissed, criticalWarning.type])}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function UsageWarningToast({
  warning,
  onDismiss,
}: {
  warning: UsageWarning;
  onDismiss: () => void;
}) {
  const isCritical = warning.isLimitReached;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border p-3 shadow-lg animate-in slide-in-from-bottom-4",
        isCritical
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-sm">
          {isCritical ? "Limite Atingido" : "Uso Alto"}
        </p>
        <p className="text-xs opacity-80">
          {isCritical
            ? `${warning.label}: Você atingiu o limite do seu plano.`
            : `${warning.label}: ${warning.percentUsed}% usado.`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/pricing">
          <Button
            variant={isCritical ? "destructive" : "default"}
            size="sm"
            className="h-7 text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
