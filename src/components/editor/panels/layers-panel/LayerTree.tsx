"use client";

import { LayerItem } from "./LayerItem";
import type { LayerNode } from "@/lib/layer-utils";

interface LayerTreeProps {
  nodes: LayerNode[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}

export function LayerTree({
  nodes,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
}: LayerTreeProps) {
  const renderNode = (node: LayerNode) => {
    return (
      <div key={node.id}>
        <LayerItem
          node={node}
          isSelected={selectedId === node.id}
          isHovered={hoveredId === node.id}
          onSelect={onSelect}
          onHover={onHover}
          onToggleExpand={onToggleExpand}
          onToggleVisibility={onToggleVisibility}
          onToggleLock={onToggleLock}
        />
        {node.isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
        No elements found
      </div>
    );
  }

  return (
    <div className="py-1">
      {nodes.map(renderNode)}
    </div>
  );
}
