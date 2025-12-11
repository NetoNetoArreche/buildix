import { cn } from "@/lib/utils";
import { CosmosLogo } from "./cosmos-logo";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <CosmosLogo className="h-8 w-8" />
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight">Buildix</span>
      )}
    </div>
  );
}
