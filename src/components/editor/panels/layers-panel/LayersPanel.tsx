"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, Layers, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LayerTree } from "./LayerTree";
import {
  buildLayerTree,
  toggleNodeExpanded,
  updateNodeInTree,
  expandPathToNode,
  type LayerNode,
} from "@/lib/layer-utils";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayersPanel({ isOpen, onClose }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localHoveredId, setLocalHoveredId] = useState<string | null>(null);

  const {
    selectedElementId,
    selectElement,
    setSelectedElementData,
    htmlContent,
  } = useEditorStore();

  const panelRef = useRef<HTMLDivElement>(null);

  // Build layer tree from iframe
  const buildTree = useCallback(() => {
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (iframe?.contentDocument?.body) {
      const tree = buildLayerTree(iframe.contentDocument.body);
      setLayers(tree);
    }
  }, []);

  // Rebuild tree when HTML content changes or panel opens
  useEffect(() => {
    if (isOpen) {
      // Delay to ensure iframe is ready and design mode is fully applied
      const timer = setTimeout(buildTree, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, htmlContent, buildTree]);

  // Expand path to selected element when selection changes
  useEffect(() => {
    if (selectedElementId && layers.length > 0) {
      setLayers(prev => expandPathToNode(prev, selectedElementId));
    }
  }, [selectedElementId]);

  // Handle element selection
  const handleSelect = useCallback((id: string) => {
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument || !iframe?.contentWindow) return;

    const element = iframe.contentDocument.querySelector(`[data-buildix-id="${id}"]`) as HTMLElement;
    if (!element) return;

    // Directly select the element via store
    selectElement(id);

    // Get computed styles
    const computedStyle = iframe.contentWindow.getComputedStyle(element);
    const computedStyles: Record<string, string> = {};
    const styleProps = [
      "color", "backgroundColor", "fontSize", "fontWeight", "fontFamily",
      "padding", "margin", "borderRadius", "display", "position",
      "width", "height", "top", "left", "right", "bottom"
    ];
    styleProps.forEach(prop => {
      computedStyles[prop] = computedStyle.getPropertyValue(
        prop.replace(/([A-Z])/g, '-$1').toLowerCase()
      );
    });

    // Extract inline styles
    const inlineStyles: Record<string, string> = {};
    const styleAttr = element.getAttribute("style");
    if (styleAttr) {
      styleAttr.split(";").forEach((declaration) => {
        const [prop, value] = declaration.split(":").map(s => s.trim());
        if (prop && value) {
          const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          inlineStyles[camelProp] = value;
        }
      });
    }

    // Get all attributes
    const attributes: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr) => {
      if (!attr.name.startsWith("data-buildix") && attr.name !== "class") {
        attributes[attr.name] = attr.value;
      }
    });

    // Update element data in store (matching SelectedElementData interface)
    setSelectedElementData({
      id,
      tagName: element.tagName.toLowerCase(),
      textContent: element.textContent || "",
      innerHTML: element.innerHTML,
      outerHTML: element.outerHTML,
      classes: element.className.replace(/buildix-[\w-]+/g, "").trim(),
      elementId: element.id || "",
      attributes,
      computedStyles,
      inlineStyles,
    });

    // Scroll the element into view within the iframe
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectElement, setSelectedElementData]);

  // Handle hover - add visual highlight directly on element (no store update to avoid re-renders)
  const handleHover = useCallback((id: string | null) => {
    setLocalHoveredId(id);

    // Add/remove hover visual directly on element in iframe
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) return;

    // Remove previous hover highlight
    iframe.contentDocument.querySelectorAll('.buildix-layer-hover').forEach(el => {
      el.classList.remove('buildix-layer-hover');
    });

    // Add hover highlight to current element
    if (id) {
      const element = iframe.contentDocument.querySelector(`[data-buildix-id="${id}"]`);
      if (element) {
        element.classList.add('buildix-layer-hover');
      }
    }
  }, []);

  // Handle expand/collapse
  const handleToggleExpand = useCallback((id: string) => {
    setLayers(prev => toggleNodeExpanded(prev, id));
  }, []);

  // Handle visibility toggle
  const handleToggleVisibility = useCallback((id: string) => {
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) return;

    const element = iframe.contentDocument.querySelector(`[data-buildix-id="${id}"]`) as HTMLElement;
    if (!element) return;

    const isCurrentlyVisible = element.style.display !== 'none';
    element.style.display = isCurrentlyVisible ? 'none' : '';

    setLayers(prev => updateNodeInTree(prev, id, { isVisible: !isCurrentlyVisible }));
  }, []);

  // Handle lock toggle
  const handleToggleLock = useCallback((id: string) => {
    setLayers(prev => {
      const node = findNodeInTree(prev, id);
      if (node) {
        return updateNodeInTree(prev, id, { isLocked: !node.isLocked });
      }
      return prev;
    });
  }, []);

  // Filter layers by search query
  const filteredLayers = searchQuery
    ? filterLayersBySearch(layers, searchQuery.toLowerCase())
    : layers;

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute left-0 top-0 h-full w-64 bg-card border-r z-50 flex flex-col shadow-lg",
        "animate-in slide-in-from-left-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Layers</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search layers"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={buildTree}
            title="Refresh layers"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Input */}
      {isSearchOpen && (
        <div className="px-3 py-2 border-b">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements..."
            className="w-full h-7 px-2 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
      )}

      {/* Layer Tree */}
      <ScrollArea className="flex-1">
        <LayerTree
          nodes={filteredLayers}
          selectedId={selectedElementId}
          hoveredId={localHoveredId}
          onSelect={handleSelect}
          onHover={handleHover}
          onToggleExpand={handleToggleExpand}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
        />
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 py-2 border-t text-[10px] text-muted-foreground">
        {countTotalNodes(layers)} elements
      </div>
    </div>
  );
}

// Helper: Find node in tree
function findNodeInTree(nodes: LayerNode[], id: string): LayerNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

// Helper: Filter layers by search
function filterLayersBySearch(nodes: LayerNode[], query: string): LayerNode[] {
  const result: LayerNode[] = [];

  for (const node of nodes) {
    const matchesSelf = node.displayName.toLowerCase().includes(query) ||
                        node.tagName.toLowerCase().includes(query);
    const filteredChildren = filterLayersBySearch(node.children, query);

    if (matchesSelf || filteredChildren.length > 0) {
      result.push({
        ...node,
        isExpanded: true, // Auto-expand to show matches
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      });
    }
  }

  return result;
}

// Helper: Count total nodes
function countTotalNodes(nodes: LayerNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    count += countTotalNodes(node.children);
  }
  return count;
}
