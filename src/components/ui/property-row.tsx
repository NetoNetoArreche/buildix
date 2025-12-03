"use client";

import { cn } from "@/lib/utils";

interface PropertyRowProps {
  label: string;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * A wrapper for property inputs that shows visual indicator for active/inactive state.
 * Active properties (user-set values) are fully visible with a subtle highlight.
 * Inactive properties (default values) are dimmed with reduced opacity.
 */
export function PropertyRow({ label, isActive = false, children, className }: PropertyRowProps) {
  return (
    <div
      className={cn(
        "space-y-1 transition-opacity duration-150",
        !isActive && "opacity-50",
        className
      )}
    >
      <label
        className={cn(
          "text-xs text-muted-foreground flex items-center gap-1.5",
          isActive && "text-foreground/80"
        )}
      >
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--buildix-primary))]" />
        )}
        {label}
      </label>
      {children}
    </div>
  );
}

interface PropertyGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * A grid layout for property inputs
 */
export function PropertyGrid({ children, columns = 2, className }: PropertyGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
