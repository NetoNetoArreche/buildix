import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--buildix-primary))]">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight">Buildix</span>
      )}
    </div>
  );
}
