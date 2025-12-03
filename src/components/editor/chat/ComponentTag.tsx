"use client";

import { Layers, X } from "lucide-react";
import type { SelectedComponent } from "@/lib/ui-components";

interface ComponentTagProps {
  component: SelectedComponent;
  onRemove: () => void;
}

export function ComponentTag({ component, onRemove }: ComponentTagProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs border border-blue-500/30">
      <Layers className="h-3 w-3 flex-shrink-0" />
      <span className="font-medium truncate max-w-[120px]">{component.name}</span>
      <span className="text-blue-400/60 hidden sm:inline">-</span>
      <span className="text-blue-400/60 hidden sm:inline">Component</span>
      <span className="text-blue-400/60">-</span>
      <span className="text-blue-400/60">
        {(component.charCount / 1000).toFixed(1)}K
      </span>
      <button
        onClick={onRemove}
        className="hover:text-white ml-0.5 p-0.5 hover:bg-blue-500/30 rounded transition-colors"
        aria-label={`Remove ${component.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
