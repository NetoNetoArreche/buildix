// Design Tokens Extraction for Multi-Page Consistency
// Extracts colors, fonts, and layout patterns from existing HTML

export interface DesignTokens {
  colors: {
    primary: string[];
    secondary: string[];
    background: string[];
    text: string[];
    accent: string[];
  };
  fonts: {
    families: string[];
    sizes: string[];
    weights: string[];
  };
  layout: {
    hasSidebar: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    containerClasses: string[];
  };
  spacing: string[];
  borderRadius: string[];
}

/**
 * Extracts design tokens from HTML content
 * @param html - The HTML content to analyze
 * @returns DesignTokens object with extracted values
 */
export function extractDesignTokens(html: string): DesignTokens {
  const tokens: DesignTokens = {
    colors: {
      primary: [],
      secondary: [],
      background: [],
      text: [],
      accent: [],
    },
    fonts: {
      families: [],
      sizes: [],
      weights: [],
    },
    layout: {
      hasSidebar: false,
      hasHeader: false,
      hasFooter: false,
      containerClasses: [],
    },
    spacing: [],
    borderRadius: [],
  };

  if (!html) return tokens;

  // Extract Tailwind color classes
  const colorPatterns = {
    primary: /(?:bg|text|border)-(?:blue|indigo|violet|purple)-(?:\d{2,3})/g,
    secondary: /(?:bg|text|border)-(?:gray|slate|zinc|neutral|stone)-(?:\d{2,3})/g,
    background: /bg-(?:white|black|gray|slate|zinc|neutral|stone)-?(?:\d{2,3})?/g,
    text: /text-(?:white|black|gray|slate|zinc|neutral|stone)-?(?:\d{2,3})?/g,
    accent: /(?:bg|text|border)-(?:green|emerald|teal|cyan|sky|amber|orange|red|rose|pink|fuchsia)-(?:\d{2,3})/g,
  };

  // Extract colors
  for (const [category, pattern] of Object.entries(colorPatterns)) {
    const matches = html.match(pattern) || [];
    tokens.colors[category as keyof typeof tokens.colors] = [...new Set(matches)];
  }

  // Extract font families from Tailwind classes
  const fontFamilyMatches = html.match(/font-(?:sans|serif|mono|display|body)/g) || [];
  tokens.fonts.families = [...new Set(fontFamilyMatches)];

  // Extract font sizes
  const fontSizeMatches = html.match(/text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/g) || [];
  tokens.fonts.sizes = [...new Set(fontSizeMatches)];

  // Extract font weights
  const fontWeightMatches = html.match(/font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g) || [];
  tokens.fonts.weights = [...new Set(fontWeightMatches)];

  // Detect layout patterns
  tokens.layout.hasSidebar = /(?:sidebar|aside|nav-sidebar|sidenav)/i.test(html) ||
    /class="[^"]*(?:w-64|w-72|w-80)[^"]*"/i.test(html);
  tokens.layout.hasHeader = /<header/i.test(html) || /class="[^"]*(?:header|navbar|topbar)[^"]*"/i.test(html);
  tokens.layout.hasFooter = /<footer/i.test(html) || /class="[^"]*footer[^"]*"/i.test(html);

  // Extract container classes
  const containerMatches = html.match(/(?:container|max-w-(?:sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|screen-sm|screen-md|screen-lg|screen-xl|screen-2xl))/g) || [];
  tokens.layout.containerClasses = [...new Set(containerMatches)];

  // Extract spacing classes
  const spacingMatches = html.match(/(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-x|space-y)-(?:\d+|auto)/g) || [];
  tokens.spacing = [...new Set(spacingMatches)].slice(0, 20); // Limit to prevent too much data

  // Extract border radius classes
  const borderRadiusMatches = html.match(/rounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?/g) || [];
  tokens.borderRadius = [...new Set(borderRadiusMatches)];

  return tokens;
}

/**
 * Converts design tokens to a context string for AI prompt
 * @param tokens - The design tokens to convert
 * @returns A formatted string describing the design system
 */
export function tokensToContext(tokens: DesignTokens): string {
  const parts: string[] = [];

  // Colors
  const allColors = [
    ...tokens.colors.primary,
    ...tokens.colors.secondary,
    ...tokens.colors.accent,
  ].slice(0, 15);

  if (allColors.length > 0) {
    parts.push(`Cores usadas: ${allColors.join(", ")}`);
  }

  // Fonts
  if (tokens.fonts.families.length > 0) {
    parts.push(`Fontes: ${tokens.fonts.families.join(", ")}`);
  }
  if (tokens.fonts.sizes.length > 0) {
    parts.push(`Tamanhos de texto: ${tokens.fonts.sizes.slice(0, 8).join(", ")}`);
  }
  if (tokens.fonts.weights.length > 0) {
    parts.push(`Pesos de fonte: ${tokens.fonts.weights.join(", ")}`);
  }

  // Layout
  const layoutParts: string[] = [];
  if (tokens.layout.hasSidebar) layoutParts.push("sidebar");
  if (tokens.layout.hasHeader) layoutParts.push("header");
  if (tokens.layout.hasFooter) layoutParts.push("footer");
  if (layoutParts.length > 0) {
    parts.push(`Layout com: ${layoutParts.join(", ")}`);
  }
  if (tokens.layout.containerClasses.length > 0) {
    parts.push(`Container: ${tokens.layout.containerClasses.join(", ")}`);
  }

  // Spacing & Border Radius
  if (tokens.borderRadius.length > 0) {
    parts.push(`Border radius: ${tokens.borderRadius.slice(0, 5).join(", ")}`);
  }

  return parts.join(". ");
}

/**
 * Extracts a summary of design patterns for multi-page consistency
 * @param pagesHtml - Array of HTML content from existing pages
 * @returns A comprehensive design context string
 */
export function extractProjectDesignContext(pagesHtml: string[]): string {
  if (!pagesHtml || pagesHtml.length === 0) return "";

  // Merge tokens from all pages
  const mergedTokens: DesignTokens = {
    colors: { primary: [], secondary: [], background: [], text: [], accent: [] },
    fonts: { families: [], sizes: [], weights: [] },
    layout: { hasSidebar: false, hasHeader: false, hasFooter: false, containerClasses: [] },
    spacing: [],
    borderRadius: [],
  };

  for (const html of pagesHtml) {
    const tokens = extractDesignTokens(html);

    // Merge colors
    for (const category of Object.keys(mergedTokens.colors) as Array<keyof typeof mergedTokens.colors>) {
      mergedTokens.colors[category] = [...new Set([...mergedTokens.colors[category], ...tokens.colors[category]])];
    }

    // Merge fonts
    mergedTokens.fonts.families = [...new Set([...mergedTokens.fonts.families, ...tokens.fonts.families])];
    mergedTokens.fonts.sizes = [...new Set([...mergedTokens.fonts.sizes, ...tokens.fonts.sizes])];
    mergedTokens.fonts.weights = [...new Set([...mergedTokens.fonts.weights, ...tokens.fonts.weights])];

    // Merge layout (any page with these elements counts)
    mergedTokens.layout.hasSidebar = mergedTokens.layout.hasSidebar || tokens.layout.hasSidebar;
    mergedTokens.layout.hasHeader = mergedTokens.layout.hasHeader || tokens.layout.hasHeader;
    mergedTokens.layout.hasFooter = mergedTokens.layout.hasFooter || tokens.layout.hasFooter;
    mergedTokens.layout.containerClasses = [...new Set([...mergedTokens.layout.containerClasses, ...tokens.layout.containerClasses])];

    // Merge spacing and border radius
    mergedTokens.spacing = [...new Set([...mergedTokens.spacing, ...tokens.spacing])];
    mergedTokens.borderRadius = [...new Set([...mergedTokens.borderRadius, ...tokens.borderRadius])];
  }

  return tokensToContext(mergedTokens);
}
