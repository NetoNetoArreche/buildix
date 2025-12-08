/**
 * Figma to HTML Converter
 * Converts Figma nodes to semantic HTML with CSS
 */

import {
  FigmaNode,
  FigmaFill,
  FigmaEffect,
  figmaColorToCss
} from "./client";

export interface ConversionOptions {
  preserveAutoLayout: boolean;
  convertEffects: boolean;
  importVariants: boolean;
  useFlexbox: boolean;
  generateTailwind: boolean;
}

export interface ConversionResult {
  html: string;
  css: string;
  tailwindClasses?: string[];
  images: Array<{ nodeId: string; ref: string }>;
}

const defaultOptions: ConversionOptions = {
  preserveAutoLayout: true,
  convertEffects: true,
  importVariants: true,
  useFlexbox: true,
  generateTailwind: false,
};

/**
 * Main converter function
 */
export function figmaToHtml(
  node: FigmaNode,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const opts = { ...defaultOptions, ...options };
  const images: Array<{ nodeId: string; ref: string }> = [];
  const cssRules: Map<string, Record<string, string>> = new Map();

  const html = convertNode(node, opts, images, cssRules, 0);
  const css = generateCss(cssRules);

  return {
    html,
    css,
    images,
  };
}

/**
 * Convert a single Figma node to HTML
 */
function convertNode(
  node: FigmaNode,
  options: ConversionOptions,
  images: Array<{ nodeId: string; ref: string }>,
  cssRules: Map<string, Record<string, string>>,
  depth: number
): string {
  const indent = "  ".repeat(depth);
  const className = sanitizeClassName(node.name);
  const styles: Record<string, string> = {};

  // Get base styles
  Object.assign(styles, getBaseStyles(node, options));

  // Get fill styles (background)
  Object.assign(styles, getFillStyles(node, images));

  // Get stroke styles (border)
  Object.assign(styles, getStrokeStyles(node));

  // Get effect styles (shadows, blur)
  if (options.convertEffects) {
    Object.assign(styles, getEffectStyles(node));
  }

  // Get layout styles (flexbox)
  if (options.preserveAutoLayout) {
    Object.assign(styles, getLayoutStyles(node, options));
  }

  // Get text styles
  if (node.type === "TEXT") {
    Object.assign(styles, getTextStyles(node));
  }

  // Store CSS rules
  if (Object.keys(styles).length > 0) {
    cssRules.set(className, styles);
  }

  // Generate HTML based on node type
  let html = "";

  switch (node.type) {
    case "TEXT":
      html = convertTextNode(node, className, indent);
      break;

    case "FRAME":
    case "GROUP":
    case "COMPONENT":
    case "COMPONENT_SET":
    case "INSTANCE":
      html = convertContainerNode(node, className, indent, depth, options, images, cssRules);
      break;

    case "RECTANGLE":
    case "ELLIPSE":
      html = convertShapeNode(node, className, indent);
      break;

    case "VECTOR":
    case "LINE":
    case "POLYGON":
    case "STAR":
      html = convertVectorNode(node, className, indent);
      break;

    default:
      // Generic container for unknown types
      if (node.children && node.children.length > 0) {
        html = convertContainerNode(node, className, indent, depth, options, images, cssRules);
      } else {
        html = `${indent}<div class="${className}"></div>\n`;
      }
  }

  return html;
}

/**
 * Convert text node
 */
function convertTextNode(node: FigmaNode, className: string, indent: string): string {
  const text = escapeHtml(node.characters || "");
  const fontSize = node.style?.fontSize || 16;

  // Determine tag based on font size
  let tag = "p";
  if (fontSize >= 32) tag = "h1";
  else if (fontSize >= 24) tag = "h2";
  else if (fontSize >= 20) tag = "h3";
  else if (fontSize >= 18) tag = "h4";
  else if (fontSize >= 16) tag = "h5";

  return `${indent}<${tag} class="${className}">${text}</${tag}>\n`;
}

/**
 * Convert container node (frame, group, component)
 */
function convertContainerNode(
  node: FigmaNode,
  className: string,
  indent: string,
  depth: number,
  options: ConversionOptions,
  images: Array<{ nodeId: string; ref: string }>,
  cssRules: Map<string, Record<string, string>>
): string {
  let childrenHtml = "";

  if (node.children && node.children.length > 0) {
    childrenHtml = node.children
      .map((child) => convertNode(child, options, images, cssRules, depth + 1))
      .join("");
  }

  // Use semantic tags when possible
  const tag = inferSemanticTag(node);

  if (childrenHtml) {
    return `${indent}<${tag} class="${className}">\n${childrenHtml}${indent}</${tag}>\n`;
  }

  return `${indent}<${tag} class="${className}"></${tag}>\n`;
}

/**
 * Convert shape node (rectangle, ellipse)
 */
function convertShapeNode(node: FigmaNode, className: string, indent: string): string {
  return `${indent}<div class="${className}"></div>\n`;
}

/**
 * Convert vector node
 */
function convertVectorNode(node: FigmaNode, className: string, indent: string): string {
  // For vectors, we'll use a placeholder div
  // In a full implementation, we'd convert to SVG
  return `${indent}<div class="${className}" aria-label="${escapeHtml(node.name)}"></div>\n`;
}

/**
 * Get base styles (dimensions, position, opacity)
 */
function getBaseStyles(node: FigmaNode, options: ConversionOptions): Record<string, string> {
  const styles: Record<string, string> = {};

  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;

    // Only set dimensions if not in auto-layout
    if (!options.preserveAutoLayout || !node.layoutMode || node.layoutMode === "NONE") {
      styles.width = `${Math.round(width)}px`;
      styles.height = `${Math.round(height)}px`;
    }
  }

  if (node.opacity !== undefined && node.opacity < 1) {
    styles.opacity = node.opacity.toFixed(2);
  }

  // Border radius
  if (node.cornerRadius) {
    styles["border-radius"] = `${node.cornerRadius}px`;
  } else if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    styles["border-radius"] = `${tl}px ${tr}px ${br}px ${bl}px`;
  }

  // Ellipse is a circle
  if (node.type === "ELLIPSE") {
    styles["border-radius"] = "50%";
  }

  return styles;
}

/**
 * Get fill styles (background)
 */
function getFillStyles(
  node: FigmaNode,
  images: Array<{ nodeId: string; ref: string }>
): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!node.fills || node.fills.length === 0) return styles;

  const visibleFills = node.fills.filter((f: FigmaFill) => f.visible !== false);
  if (visibleFills.length === 0) return styles;

  const fill = visibleFills[0];

  switch (fill.type) {
    case "SOLID":
      if (fill.color) {
        const color = figmaColorToCss({
          ...fill.color,
          a: (fill.opacity ?? 1) * (fill.color.a ?? 1),
        });
        styles["background-color"] = color;
      }
      break;

    case "GRADIENT_LINEAR":
      if (fill.gradientStops && fill.gradientHandlePositions) {
        styles.background = convertLinearGradient(fill);
      }
      break;

    case "GRADIENT_RADIAL":
      if (fill.gradientStops) {
        styles.background = convertRadialGradient(fill);
      }
      break;

    case "IMAGE":
      if (fill.imageRef) {
        images.push({ nodeId: node.id, ref: fill.imageRef });
        styles["background-size"] = fill.scaleMode === "FIT" ? "contain" : "cover";
        styles["background-position"] = "center";
        styles["background-repeat"] = "no-repeat";
      }
      break;
  }

  return styles;
}

/**
 * Get stroke styles (border)
 */
function getStrokeStyles(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!node.strokes || node.strokes.length === 0) return styles;

  const visibleStrokes = node.strokes.filter((s) => s.visible !== false);
  if (visibleStrokes.length === 0) return styles;

  const stroke = visibleStrokes[0];

  if (stroke.type === "SOLID" && stroke.color) {
    const color = figmaColorToCss({
      ...stroke.color,
      a: (stroke.opacity ?? 1) * (stroke.color.a ?? 1),
    });
    styles.border = `1px solid ${color}`;
  }

  return styles;
}

/**
 * Get effect styles (shadows, blur)
 */
function getEffectStyles(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!node.effects || node.effects.length === 0) return styles;

  const visibleEffects = node.effects.filter((e: FigmaEffect) => e.visible !== false);
  if (visibleEffects.length === 0) return styles;

  const shadows: string[] = [];
  let blur = 0;

  for (const effect of visibleEffects) {
    switch (effect.type) {
      case "DROP_SHADOW":
      case "INNER_SHADOW": {
        const x = effect.offset?.x ?? 0;
        const y = effect.offset?.y ?? 0;
        const radius = effect.radius ?? 0;
        const spread = effect.spread ?? 0;
        const color = effect.color ? figmaColorToCss(effect.color) : "rgba(0,0,0,0.25)";
        const inset = effect.type === "INNER_SHADOW" ? "inset " : "";
        shadows.push(`${inset}${x}px ${y}px ${radius}px ${spread}px ${color}`);
        break;
      }

      case "LAYER_BLUR":
      case "BACKGROUND_BLUR":
        blur = Math.max(blur, effect.radius);
        break;
    }
  }

  if (shadows.length > 0) {
    styles["box-shadow"] = shadows.join(", ");
  }

  if (blur > 0) {
    styles.filter = `blur(${blur}px)`;
  }

  return styles;
}

/**
 * Get layout styles (flexbox from auto-layout)
 */
function getLayoutStyles(node: FigmaNode, options: ConversionOptions): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!node.layoutMode || node.layoutMode === "NONE") return styles;

  if (!options.useFlexbox) return styles;

  styles.display = "flex";
  styles["flex-direction"] = node.layoutMode === "HORIZONTAL" ? "row" : "column";

  // Gap (item spacing)
  if (node.itemSpacing) {
    styles.gap = `${node.itemSpacing}px`;
  }

  // Padding
  const padding: string[] = [];
  if (node.paddingTop) padding.push(`${node.paddingTop}px`);
  if (node.paddingRight) padding.push(`${node.paddingRight}px`);
  if (node.paddingBottom) padding.push(`${node.paddingBottom}px`);
  if (node.paddingLeft) padding.push(`${node.paddingLeft}px`);

  if (padding.length > 0) {
    // Optimize padding if all values are the same
    const uniquePadding = [...new Set(padding)];
    if (uniquePadding.length === 1) {
      styles.padding = uniquePadding[0];
    } else if (padding.length === 4) {
      styles.padding = padding.join(" ");
    }
  }

  // Primary axis alignment (justify-content)
  switch (node.primaryAxisAlignItems) {
    case "MIN":
      styles["justify-content"] = "flex-start";
      break;
    case "MAX":
      styles["justify-content"] = "flex-end";
      break;
    case "CENTER":
      styles["justify-content"] = "center";
      break;
    case "SPACE_BETWEEN":
      styles["justify-content"] = "space-between";
      break;
  }

  // Counter axis alignment (align-items)
  switch (node.counterAxisAlignItems) {
    case "MIN":
      styles["align-items"] = "flex-start";
      break;
    case "MAX":
      styles["align-items"] = "flex-end";
      break;
    case "CENTER":
      styles["align-items"] = "center";
      break;
    case "BASELINE":
      styles["align-items"] = "baseline";
      break;
  }

  // Auto sizing
  if (node.primaryAxisSizingMode === "AUTO") {
    if (node.layoutMode === "HORIZONTAL") {
      styles.width = "auto";
    } else {
      styles.height = "auto";
    }
  }

  if (node.counterAxisSizingMode === "AUTO") {
    if (node.layoutMode === "HORIZONTAL") {
      styles.height = "auto";
    } else {
      styles.width = "auto";
    }
  }

  // Flex grow
  if (node.layoutGrow && node.layoutGrow > 0) {
    styles["flex-grow"] = String(node.layoutGrow);
  }

  return styles;
}

/**
 * Get text styles
 */
function getTextStyles(node: FigmaNode): Record<string, string> {
  const styles: Record<string, string> = {};
  const textStyle = node.style;

  if (!textStyle) return styles;

  if (textStyle.fontFamily) {
    styles["font-family"] = `"${textStyle.fontFamily}", sans-serif`;
  }

  if (textStyle.fontSize) {
    styles["font-size"] = `${textStyle.fontSize}px`;
  }

  if (textStyle.fontWeight) {
    styles["font-weight"] = String(textStyle.fontWeight);
  }

  if (textStyle.letterSpacing) {
    styles["letter-spacing"] = `${textStyle.letterSpacing}px`;
  }

  if (textStyle.lineHeightPx) {
    styles["line-height"] = `${textStyle.lineHeightPx}px`;
  }

  // Text alignment
  switch (textStyle.textAlignHorizontal) {
    case "LEFT":
      styles["text-align"] = "left";
      break;
    case "RIGHT":
      styles["text-align"] = "right";
      break;
    case "CENTER":
      styles["text-align"] = "center";
      break;
    case "JUSTIFIED":
      styles["text-align"] = "justify";
      break;
  }

  // Text case
  switch (textStyle.textCase) {
    case "UPPER":
      styles["text-transform"] = "uppercase";
      break;
    case "LOWER":
      styles["text-transform"] = "lowercase";
      break;
    case "TITLE":
      styles["text-transform"] = "capitalize";
      break;
  }

  // Text decoration
  switch (textStyle.textDecoration) {
    case "UNDERLINE":
      styles["text-decoration"] = "underline";
      break;
    case "STRIKETHROUGH":
      styles["text-decoration"] = "line-through";
      break;
  }

  // Text color from fills
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills.find((f: FigmaFill) => f.type === "SOLID" && f.visible !== false);
    if (fill && fill.color) {
      styles.color = figmaColorToCss(fill.color);
    }
  }

  return styles;
}

/**
 * Convert linear gradient
 */
function convertLinearGradient(fill: FigmaFill): string {
  if (!fill.gradientStops || !fill.gradientHandlePositions) {
    return "transparent";
  }

  const stops = fill.gradientStops
    .map((stop) => {
      const color = figmaColorToCss(stop.color);
      const position = Math.round(stop.position * 100);
      return `${color} ${position}%`;
    })
    .join(", ");

  // Calculate angle from handle positions
  const [start, end] = fill.gradientHandlePositions;
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;

  return `linear-gradient(${Math.round(angle)}deg, ${stops})`;
}

/**
 * Convert radial gradient
 */
function convertRadialGradient(fill: FigmaFill): string {
  if (!fill.gradientStops) {
    return "transparent";
  }

  const stops = fill.gradientStops
    .map((stop) => {
      const color = figmaColorToCss(stop.color);
      const position = Math.round(stop.position * 100);
      return `${color} ${position}%`;
    })
    .join(", ");

  return `radial-gradient(circle, ${stops})`;
}

/**
 * Infer semantic HTML tag from node name
 */
function inferSemanticTag(node: FigmaNode): string {
  const nameLower = node.name.toLowerCase();

  if (nameLower.includes("nav") || nameLower.includes("menu")) return "nav";
  if (nameLower.includes("header")) return "header";
  if (nameLower.includes("footer")) return "footer";
  if (nameLower.includes("section")) return "section";
  if (nameLower.includes("article")) return "article";
  if (nameLower.includes("aside") || nameLower.includes("sidebar")) return "aside";
  if (nameLower.includes("main")) return "main";
  if (nameLower.includes("button") || nameLower.includes("btn")) return "button";
  if (nameLower.includes("link")) return "a";
  if (nameLower.includes("image") || nameLower.includes("img") || nameLower.includes("photo")) return "figure";
  if (nameLower.includes("list")) return "ul";
  if (nameLower.includes("item")) return "li";

  return "div";
}

/**
 * Sanitize class name
 */
function sanitizeClassName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50) || "element";
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate CSS from rules map
 */
function generateCss(cssRules: Map<string, Record<string, string>>): string {
  const lines: string[] = [];

  cssRules.forEach((styles, className) => {
    const props = Object.entries(styles)
      .map(([prop, value]) => `  ${prop}: ${value};`)
      .join("\n");

    if (props) {
      lines.push(`.${className} {\n${props}\n}`);
    }
  });

  return lines.join("\n\n");
}
