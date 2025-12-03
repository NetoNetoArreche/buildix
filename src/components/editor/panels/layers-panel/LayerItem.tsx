"use client";

import { ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayerNode } from "@/lib/layer-utils";

interface LayerItemProps {
  node: LayerNode;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}

export function LayerItem({
  node,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
}: LayerItemProps) {
  const indent = node.depth * 16;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.isLocked) {
      onSelect(node.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(node.id);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(node.id);
  };

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(node.id);
  };

  return (
    <div
      className={cn(
        "group flex items-center h-7 px-2 cursor-pointer transition-colors",
        isSelected && "bg-[hsl(var(--buildix-primary))]/20",
        isHovered && !isSelected && "bg-muted/50",
        !node.isVisible && "opacity-50",
        node.isLocked && "cursor-not-allowed"
      )}
      style={{ paddingLeft: `${indent + 8}px` }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Expand/Collapse Toggle */}
      <div className="w-4 h-4 flex items-center justify-center shrink-0">
        {node.hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="hover:bg-muted rounded p-0.5"
          >
            {node.isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3" />
        )}
      </div>

      {/* Element Name */}
      <span
        className={cn(
          "flex-1 text-xs truncate ml-1",
          isSelected ? "text-[hsl(var(--buildix-primary))] font-medium" : "text-foreground"
        )}
      >
        {node.displayName}
      </span>

      {/* Action Buttons (visible on hover or when active) */}
      <div className={cn(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        (isSelected || !node.isVisible || node.isLocked) && "opacity-100"
      )}>
        {/* Visibility Toggle */}
        <button
          onClick={handleToggleVisibility}
          className={cn(
            "p-1 rounded hover:bg-muted/80",
            !node.isVisible && "text-muted-foreground"
          )}
          title={node.isVisible ? "Hide element" : "Show element"}
        >
          {node.isVisible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </button>

        {/* Lock Toggle */}
        <button
          onClick={handleToggleLock}
          className={cn(
            "p-1 rounded hover:bg-muted/80",
            node.isLocked && "text-orange-500"
          )}
          title={node.isLocked ? "Unlock element" : "Lock element"}
        >
          {node.isLocked ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Unlock className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}
