/**
 * Layer utilities for building DOM tree representation
 */

export interface LayerNode {
  id: string;              // data-buildix-id
  tagName: string;
  displayName: string;     // "div.card", "img#hero"
  children: LayerNode[];
  isExpanded: boolean;
  isVisible: boolean;
  isLocked: boolean;
  depth: number;
  hasChildren: boolean;
}

// Tags to skip (not selectable/displayable in layers)
const SKIPPED_TAGS = ["script", "style", "meta", "link", "head", "html", "noscript"];

// SVG child elements that should show but not be independently selectable
const SVG_CHILD_TAGS = [
  "path", "circle", "rect", "line", "polyline", "polygon",
  "ellipse", "g", "use", "text", "tspan", "defs", "symbol",
  "clippath", "mask", "pattern", "image", "switch", "foreignobject"
];

/**
 * Build a display name for an element (tag.class or tag#id)
 */
function buildDisplayName(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id;
  const classes = element.className;

  // Clean classes (remove buildix internal classes)
  const cleanClasses = typeof classes === 'string'
    ? classes.split(' ').filter(c => c && !c.startsWith('buildix-'))[0]
    : '';

  if (id && !id.startsWith('buildix')) {
    return `${tag}#${id}`;
  }
  if (cleanClasses) {
    return `${tag}.${cleanClasses}`;
  }
  return tag;
}

/**
 * Check if an element should be visible in the layers panel
 */
function shouldShowElement(element: Element): boolean {
  const tag = element.tagName.toLowerCase();

  // Skip internal tags
  if (SKIPPED_TAGS.includes(tag)) return false;

  // Skip buildix internal elements
  if (element.hasAttribute('data-buildix-bg-asset')) return false;
  if (element.classList.contains('buildix-element-label')) return false;
  if (element.classList.contains('buildix-action-bar')) return false;
  if (element.classList.contains('buildix-spacing-label')) return false;

  return true;
}

/**
 * Build the layer tree from a DOM element
 */
export function buildLayerTree(
  element: Element,
  depth = 0,
  defaultExpandDepth = 2
): LayerNode[] {
  const nodes: LayerNode[] = [];

  Array.from(element.children).forEach((child) => {
    if (!shouldShowElement(child)) return;

    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const id = el.getAttribute('data-buildix-id') || `temp-${Math.random().toString(36).substr(2, 9)}`;

    // Check if element is visible (not display:none)
    const isVisible = el.style.display !== 'none' && !el.hidden;

    // Recursively build children
    const children = buildLayerTree(el, depth + 1, defaultExpandDepth);
    const hasChildren = children.length > 0;

    // SVG child elements - show in tree but mark them
    const isSvgChild = SVG_CHILD_TAGS.includes(tag);

    nodes.push({
      id,
      tagName: tag,
      displayName: buildDisplayName(el),
      children,
      isExpanded: depth < defaultExpandDepth,
      isVisible,
      isLocked: false,
      depth,
      hasChildren,
    });
  });

  return nodes;
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(nodes: LayerNode[], id: string): LayerNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Update a node's property in the tree (immutable)
 */
export function updateNodeInTree(
  nodes: LayerNode[],
  id: string,
  updates: Partial<LayerNode>
): LayerNode[] {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, id, updates) };
    }
    return node;
  });
}

/**
 * Toggle expand/collapse for a node
 */
export function toggleNodeExpanded(nodes: LayerNode[], id: string): LayerNode[] {
  return updateNodeInTree(nodes, id, {
    isExpanded: !findNodeById(nodes, id)?.isExpanded
  });
}

/**
 * Expand all ancestors of a node (to make it visible in tree)
 */
export function expandPathToNode(nodes: LayerNode[], targetId: string): LayerNode[] {
  let result = [...nodes];

  function findAndExpandPath(currentNodes: LayerNode[], path: string[]): boolean {
    for (const node of currentNodes) {
      if (node.id === targetId) {
        // Found the target, expand all nodes in path
        path.forEach(pathId => {
          result = updateNodeInTree(result, pathId, { isExpanded: true });
        });
        return true;
      }
      if (node.children.length > 0) {
        if (findAndExpandPath(node.children, [...path, node.id])) {
          return true;
        }
      }
    }
    return false;
  }

  findAndExpandPath(nodes, []);
  return result;
}

/**
 * Count total visible nodes (for scroll calculations)
 */
export function countVisibleNodes(nodes: LayerNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.isExpanded && node.children.length > 0) {
      count += countVisibleNodes(node.children);
    }
  }
  return count;
}
