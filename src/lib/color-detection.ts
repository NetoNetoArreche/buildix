// Color Detection for the Colors Modal
// Scans the iframe document for all color-related Tailwind classes

import { getColorHex, parseColorClass, tailwindColors } from "./color-presets";

export type DetectedColorType = "text" | "background" | "border" | "hover" | "gradient";

export interface DetectedColor {
  id: string;
  className: string;        // Full class name: "text-white", "bg-neutral-500", "hover:text-white"
  displayName: string;      // Display name: "white", "neutral-500"
  colorValue: string;       // Hex color value
  type: DetectedColorType;
  usageCount: number;       // How many times it's used
  elements: string[];       // Element IDs that use this color
  opacity?: string;         // Opacity modifier if any
}

export interface ColorGroup {
  name: string;             // "Neutral", "Green", "White", etc.
  displayColor: string;     // Representative color (500 shade or the color itself)
  usageCount: number;       // Total elements using colors from this group
  colors: DetectedColor[];  // All colors in this group
}

// Regex patterns for color detection
const colorPatterns = {
  // Text colors
  text: /^text-(white|black|transparent)$|^text-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  // Background colors
  background: /^bg-(white|black|transparent)$|^bg-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$|^bg-\[#[0-9a-fA-F]+\]$/,
  // Border colors
  border: /^border-(white|black|transparent)$|^border-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  // Hover states
  hoverText: /^hover:text-(white|black|transparent)$|^hover:text-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  hoverBg: /^hover:bg-(white|black|transparent)$|^hover:bg-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  hoverBorder: /^hover:border-(white|black|transparent)$|^hover:border-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  // Gradients
  gradientFrom: /^from-(white|black|transparent)$|^from-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  gradientTo: /^to-(white|black|transparent)$|^to-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
  gradientVia: /^via-(white|black|transparent)$|^via-(\w+)-(\d+)(?:\/(\d+|\[\d+\.?\d*\]))?$/,
};

// Extract color info from a class name
function extractColorInfo(className: string): { colorName: string; shade: string | null; opacity: string | null; type: DetectedColorType } | null {
  // Determine type
  let type: DetectedColorType = "text";
  let cleanClass = className;

  if (className.startsWith("hover:")) {
    type = "hover";
    cleanClass = className.replace("hover:", "");
  }

  if (cleanClass.startsWith("text-")) {
    type = className.startsWith("hover:") ? "hover" : "text";
    cleanClass = cleanClass.replace("text-", "");
  } else if (cleanClass.startsWith("bg-")) {
    type = className.startsWith("hover:") ? "hover" : "background";
    cleanClass = cleanClass.replace("bg-", "");
  } else if (cleanClass.startsWith("border-")) {
    type = className.startsWith("hover:") ? "hover" : "border";
    cleanClass = cleanClass.replace("border-", "");
  } else if (cleanClass.startsWith("from-") || cleanClass.startsWith("to-") || cleanClass.startsWith("via-")) {
    type = "gradient";
    cleanClass = cleanClass.replace(/^(from|to|via)-/, "");
  } else {
    return null;
  }

  // Handle arbitrary values like bg-[#050505]
  if (cleanClass.startsWith("[#")) {
    const hexMatch = cleanClass.match(/\[#([0-9a-fA-F]+)\]/);
    if (hexMatch) {
      return { colorName: `#${hexMatch[1]}`, shade: null, opacity: null, type };
    }
  }

  // Parse the color
  const parsed = parseColorClass(cleanClass);
  if (parsed) {
    return { ...parsed, type };
  }

  // Handle special colors
  if (cleanClass === "white" || cleanClass === "black" || cleanClass === "transparent") {
    // Check for opacity
    const opacityMatch = className.match(/\/([\d.]+|\[\d+\.?\d*\])/);
    return { colorName: cleanClass, shade: null, opacity: opacityMatch ? opacityMatch[1] : null, type };
  }

  // Handle color-shade pattern
  const match = cleanClass.match(/^(\w+)-(\d+)/);
  if (match) {
    const [, colorName, shade] = match;
    if (tailwindColors[colorName]) {
      const opacityMatch = className.match(/\/([\d.]+|\[\d+\.?\d*\])/);
      return { colorName, shade, opacity: opacityMatch ? opacityMatch[1] : null, type };
    }
  }

  return null;
}

// Check if a class is a color class
function isColorClass(className: string): boolean {
  for (const pattern of Object.values(colorPatterns)) {
    if (pattern.test(className)) {
      return true;
    }
  }
  // Also check for arbitrary color values
  if (className.match(/^(text|bg|border|from|to|via)-\[#[0-9a-fA-F]+\]/)) {
    return true;
  }
  return false;
}

// Detect all colors in a document
export function detectColorsInDocument(doc: Document): DetectedColor[] {
  const colorMap = new Map<string, DetectedColor>();

  // Scan all elements
  doc.querySelectorAll("*").forEach((element) => {
    const classes = element.className;
    if (typeof classes !== "string") return;

    const elementId = element.getAttribute("data-buildix-id") || "";
    const classList = classes.split(/\s+/).filter(Boolean);

    classList.forEach((className) => {
      if (!isColorClass(className)) return;

      const colorInfo = extractColorInfo(className);
      if (!colorInfo) return;

      const { colorName, shade, opacity, type } = colorInfo;

      // Get the hex value
      let colorValue: string;
      if (colorName.startsWith("#")) {
        colorValue = colorName;
      } else if (colorName === "white") {
        colorValue = "#ffffff";
      } else if (colorName === "black") {
        colorValue = "#000000";
      } else if (colorName === "transparent") {
        colorValue = "transparent";
      } else {
        colorValue = getColorHex(colorName, shade || undefined) || "#000000";
      }

      // Create display name
      let displayName: string;
      if (colorName.startsWith("#")) {
        displayName = colorName;
      } else if (shade) {
        displayName = `${colorName}-${shade}`;
      } else {
        displayName = colorName;
      }

      // Add opacity to display name if present
      if (opacity) {
        displayName += `/${opacity}`;
      }

      // Use the full className as the key
      const key = className;

      if (colorMap.has(key)) {
        const existing = colorMap.get(key)!;
        existing.usageCount++;
        if (elementId && !existing.elements.includes(elementId)) {
          existing.elements.push(elementId);
        }
      } else {
        colorMap.set(key, {
          id: `color-${colorMap.size}`,
          className,
          displayName,
          colorValue,
          type,
          usageCount: 1,
          elements: elementId ? [elementId] : [],
          opacity: opacity || undefined,
        });
      }
    });
  });

  // Sort by usage count (descending)
  return Array.from(colorMap.values()).sort((a, b) => b.usageCount - a.usageCount);
}

// Group colors by their base color name
export function groupColorsByName(colors: DetectedColor[]): ColorGroup[] {
  const groupMap = new Map<string, ColorGroup>();

  colors.forEach((color) => {
    // Extract the base color name
    let baseName: string;
    if (color.displayName.startsWith("#")) {
      baseName = color.displayName;
    } else {
      const match = color.displayName.match(/^(\w+)/);
      baseName = match ? match[1] : color.displayName;
    }

    // Capitalize the name
    const displayName = baseName.startsWith("#")
      ? baseName
      : baseName.charAt(0).toUpperCase() + baseName.slice(1);

    if (groupMap.has(baseName)) {
      const group = groupMap.get(baseName)!;
      group.usageCount += color.usageCount;
      group.colors.push(color);
    } else {
      // Get representative color (500 shade or the color itself)
      let displayColor: string;
      if (baseName.startsWith("#")) {
        displayColor = baseName;
      } else if (baseName === "white") {
        displayColor = "#ffffff";
      } else if (baseName === "black") {
        displayColor = "#000000";
      } else {
        displayColor = getColorHex(baseName, "500") || color.colorValue;
      }

      groupMap.set(baseName, {
        name: displayName,
        displayColor,
        usageCount: color.usageCount,
        colors: [color],
      });
    }
  });

  // Sort by usage count (descending)
  return Array.from(groupMap.values()).sort((a, b) => b.usageCount - a.usageCount);
}

// Filter colors by type
export function filterColorsByType(colors: DetectedColor[], filter: "all" | DetectedColorType): DetectedColor[] {
  if (filter === "all") return colors;
  return colors.filter((c) => c.type === filter);
}

// Replace a color class in the document
export function replaceColorInDocument(
  doc: Document,
  oldClassName: string,
  newClassName: string
): { success: boolean; elementsChanged: number } {
  let elementsChanged = 0;

  doc.querySelectorAll("*").forEach((element) => {
    if (element.classList.contains(oldClassName)) {
      element.classList.remove(oldClassName);
      element.classList.add(newClassName);
      elementsChanged++;
    }
  });

  return { success: elementsChanged > 0, elementsChanged };
}

// Replace all colors of a type (e.g., all neutral to gray)
export function replaceColorFamily(
  doc: Document,
  oldColorName: string,
  newColorName: string
): { success: boolean; elementsChanged: number } {
  let elementsChanged = 0;
  const prefixes = ["text-", "bg-", "border-", "from-", "to-", "via-"];
  const hoverPrefixes = prefixes.map((p) => `hover:${p}`);
  const allPrefixes = [...prefixes, ...hoverPrefixes];

  doc.querySelectorAll("*").forEach((element) => {
    const classes = Array.from(element.classList);
    let changed = false;

    classes.forEach((className) => {
      allPrefixes.forEach((prefix) => {
        // Match patterns like text-neutral-500, bg-neutral-800, etc.
        const pattern = new RegExp(`^${prefix.replace(":", "\\:")}${oldColorName}-(\\d+)(.*)$`);
        const match = className.match(pattern);

        if (match) {
          const shade = match[1];
          const rest = match[2] || "";
          const newClass = `${prefix}${newColorName}-${shade}${rest}`;

          element.classList.remove(className);
          element.classList.add(newClass);
          changed = true;
        }
      });
    });

    if (changed) elementsChanged++;
  });

  return { success: elementsChanged > 0, elementsChanged };
}

// Get type label for display
export function getColorTypeLabel(type: DetectedColorType): string {
  switch (type) {
    case "text":
      return "Text";
    case "background":
      return "Background";
    case "border":
      return "Border";
    case "hover":
      return "Hover";
    case "gradient":
      return "Gradient";
    default:
      return "Color";
  }
}

// List of neutral color families that can be swapped
const neutralFamilies = ["neutral", "gray", "slate", "zinc", "stone"];

// List of accent/primary color families
const accentFamilies = ["red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"];

// Apply a complete theme to the document
// This replaces neutral colors with the theme's neutral and accent colors with the theme's primary/accent
export function applyThemeToDocument(
  doc: Document,
  theme: {
    primary: string;
    accent?: string;
    neutral?: string;
  }
): { success: boolean; elementsChanged: number } {
  let totalElementsChanged = 0;
  const prefixes = ["text-", "bg-", "border-", "from-", "to-", "via-", "ring-", "outline-", "divide-"];
  const statePrefixes = ["hover:", "focus:", "active:", "group-hover:", "dark:"];

  // Build all prefix combinations
  const allPrefixes: string[] = [];
  prefixes.forEach(p => {
    allPrefixes.push(p);
    statePrefixes.forEach(s => {
      allPrefixes.push(s + p);
    });
  });

  doc.querySelectorAll("*").forEach((element) => {
    const classes = Array.from(element.classList);
    let changed = false;

    classes.forEach((className) => {
      // Check each prefix
      for (const prefix of allPrefixes) {
        const escapedPrefix = prefix.replace(/:/g, "\\:");

        // Match color classes with shade (e.g., text-neutral-500, bg-blue-400)
        const pattern = new RegExp(`^${escapedPrefix}(\\w+)-(\\d+)(\\/[\\d.]+|\\[\\.?\\d+\\])?$`);
        const match = className.match(pattern);

        if (match) {
          const [, colorName, shade, opacity] = match;
          const opacityPart = opacity || "";

          // Check if it's a neutral color that should be replaced
          if (neutralFamilies.includes(colorName) && theme.neutral && colorName !== theme.neutral) {
            const newClass = `${prefix}${theme.neutral}-${shade}${opacityPart}`;
            element.classList.remove(className);
            element.classList.add(newClass);
            changed = true;
          }
          // Check if it's an accent color that should be replaced with primary
          else if (accentFamilies.includes(colorName) && theme.primary && colorName !== theme.primary) {
            const newClass = `${prefix}${theme.primary}-${shade}${opacityPart}`;
            element.classList.remove(className);
            element.classList.add(newClass);
            changed = true;
          }
        }
      }
    });

    if (changed) totalElementsChanged++;
  });

  return { success: totalElementsChanged > 0, elementsChanged: totalElementsChanged };
}
