"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Se true, a seção será aberta automaticamente. Tem precedência sobre defaultOpen. */
  hasActiveProperties?: boolean;
  /** Badge counter to display */
  badge?: number;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  className,
  hasActiveProperties,
  badge,
}: CollapsibleSectionProps) {
  // Se hasActiveProperties é definido, usamos ele para controlar o estado inicial
  // Se não definido, usamos defaultOpen
  const initialOpen = hasActiveProperties !== undefined ? hasActiveProperties : defaultOpen;
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  // Ref para rastrear o primeiro elemento selecionado
  const isFirstRender = React.useRef(true);

  // Atualiza o estado quando hasActiveProperties muda (quando seleciona um novo elemento)
  React.useEffect(() => {
    // Ignora o primeiro render para não conflitar com o estado inicial
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Quando hasActiveProperties é definido, atualiza o estado
    if (hasActiveProperties !== undefined) {
      setIsOpen(hasActiveProperties);
    }
  }, [hasActiveProperties]);

  return (
    <div className={cn("border-b border-border/50", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 px-1 text-sm font-medium hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span>{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-3 px-1">{children}</div>
      </div>
    </div>
  );
}
