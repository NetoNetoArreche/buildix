/**
 * Design Context Extraction
 *
 * Extracts design patterns from HTML content (Tailwind classes)
 * to help AI generate components that match the existing design.
 */

export interface DesignContext {
  colors: {
    primary: string[];
    background: string[];
    text: string[];
    accent: string[];
  };
  typography: {
    fontFamilies: string[];
    headingSizes: string[];
    bodySizes: string[];
    fontWeights: string[];
  };
  spacing: {
    padding: string[];
    margin: string[];
    gap: string[];
  };
  style: {
    hasGradients: boolean;
    hasShadows: boolean;
    borderRadius: string[];
    isDarkTheme: boolean;
  };
}

/**
 * Extract design context from HTML content by analyzing Tailwind classes
 */
export function extractDesignContext(html: string): DesignContext {
  const context: DesignContext = {
    colors: { primary: [], background: [], text: [], accent: [] },
    typography: { fontFamilies: [], headingSizes: [], bodySizes: [], fontWeights: [] },
    spacing: { padding: [], margin: [], gap: [] },
    style: { hasGradients: false, hasShadows: false, borderRadius: [], isDarkTheme: false }
  };

  // Extract all classes from HTML
  const classMatches = html.match(/class="([^"]+)"/g) || [];
  const classSet = new Set<string>();

  classMatches.forEach(match => {
    const classes = match.replace('class="', '').replace('"', '').split(/\s+/);
    classes.forEach(c => {
      if (c.trim()) classSet.add(c.trim());
    });
  });

  // Count occurrences for prioritization
  const classCount: Record<string, number> = {};
  classMatches.forEach(match => {
    const classes = match.replace('class="', '').replace('"', '').split(/\s+/);
    classes.forEach(c => {
      if (c.trim()) {
        classCount[c.trim()] = (classCount[c.trim()] || 0) + 1;
      }
    });
  });

  // Analyze each class
  classSet.forEach(cls => {
    // Background colors (neutral/gray shades)
    if (cls.match(/^bg-(zinc|slate|gray|neutral|stone)-(\d+)/)) {
      context.colors.background.push(cls);
      const shade = parseInt(cls.match(/\d+/)?.[0] || '0');
      if (shade >= 800) {
        context.style.isDarkTheme = true;
      }
    }

    // Background colors (accent/primary)
    if (cls.match(/^bg-(violet|purple|blue|green|red|amber|pink|indigo|cyan|teal|emerald|rose|orange|yellow|lime|sky|fuchsia)-/)) {
      context.colors.accent.push(cls);
    }

    // Special backgrounds
    if (cls === 'bg-white') context.colors.background.push(cls);
    if (cls === 'bg-black') {
      context.colors.background.push(cls);
      context.style.isDarkTheme = true;
    }

    // Text colors (neutral)
    if (cls.match(/^text-(white|black)$/)) {
      context.colors.text.push(cls);
    }
    if (cls.match(/^text-(zinc|slate|gray|neutral|stone)-/)) {
      context.colors.text.push(cls);
    }

    // Text colors (primary/accent)
    if (cls.match(/^text-(violet|purple|blue|green|red|amber|pink|indigo|cyan|teal|emerald|rose|orange|yellow|lime|sky|fuchsia)-/)) {
      context.colors.primary.push(cls);
    }

    // Gradients
    if (cls.includes('gradient') || cls.startsWith('from-') || cls.startsWith('to-') || cls.startsWith('via-')) {
      context.style.hasGradients = true;
    }

    // Shadows
    if (cls.startsWith('shadow')) {
      context.style.hasShadows = true;
    }

    // Border radius
    if (cls.startsWith('rounded')) {
      context.style.borderRadius.push(cls);
    }

    // Font families
    if (cls.match(/^font-(sans|serif|mono)$/)) {
      context.typography.fontFamilies.push(cls);
    }

    // Font weights
    if (cls.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/)) {
      context.typography.fontWeights.push(cls);
    }

    // Text sizes
    if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/)) {
      context.typography.headingSizes.push(cls);
    }

    // Padding
    if (cls.match(/^(p|px|py|pt|pb|pl|pr)-\d+$/)) {
      context.spacing.padding.push(cls);
    }

    // Margin
    if (cls.match(/^(m|mx|my|mt|mb|ml|mr)-\d+$/)) {
      context.spacing.margin.push(cls);
    }

    // Gap
    if (cls.match(/^gap-\d+$/)) {
      context.spacing.gap.push(cls);
    }
  });

  // Sort by frequency and deduplicate, keeping most common
  const sortByFrequency = (arr: string[]) => {
    const unique = [...new Set(arr)];
    return unique.sort((a, b) => (classCount[b] || 0) - (classCount[a] || 0));
  };

  context.colors.background = sortByFrequency(context.colors.background).slice(0, 5);
  context.colors.text = sortByFrequency(context.colors.text).slice(0, 5);
  context.colors.accent = sortByFrequency(context.colors.accent).slice(0, 5);
  context.colors.primary = sortByFrequency(context.colors.primary).slice(0, 3);
  context.typography.fontFamilies = sortByFrequency(context.typography.fontFamilies).slice(0, 2);
  context.typography.fontWeights = sortByFrequency(context.typography.fontWeights).slice(0, 3);
  context.typography.headingSizes = sortByFrequency(context.typography.headingSizes).slice(0, 5);
  context.style.borderRadius = sortByFrequency(context.style.borderRadius).slice(0, 3);
  context.spacing.padding = sortByFrequency(context.spacing.padding).slice(0, 5);
  context.spacing.margin = sortByFrequency(context.spacing.margin).slice(0, 5);
  context.spacing.gap = sortByFrequency(context.spacing.gap).slice(0, 3);

  return context;
}

/**
 * Convert design context to a prompt string for AI
 */
export function designContextToPrompt(context: DesignContext): string {
  const lines: string[] = ['DESIGN SYSTEM TO MATCH:'];

  // Theme
  lines.push(`- Theme: ${context.style.isDarkTheme ? 'Dark (use dark backgrounds and light text)' : 'Light (use light backgrounds and dark text)'}`);

  // Colors
  if (context.colors.background.length > 0) {
    lines.push(`- Background colors: ${context.colors.background.join(', ')}`);
  }
  if (context.colors.text.length > 0) {
    lines.push(`- Text colors: ${context.colors.text.join(', ')}`);
  }
  if (context.colors.accent.length > 0) {
    lines.push(`- Accent colors: ${context.colors.accent.join(', ')}`);
  }
  if (context.colors.primary.length > 0) {
    lines.push(`- Primary/highlight text: ${context.colors.primary.join(', ')}`);
  }

  // Typography
  if (context.typography.fontFamilies.length > 0) {
    lines.push(`- Font families: ${context.typography.fontFamilies.join(', ')}`);
  }
  if (context.typography.fontWeights.length > 0) {
    lines.push(`- Font weights used: ${context.typography.fontWeights.join(', ')}`);
  }
  if (context.typography.headingSizes.length > 0) {
    lines.push(`- Text sizes: ${context.typography.headingSizes.join(', ')}`);
  }

  // Border radius
  if (context.style.borderRadius.length > 0) {
    lines.push(`- Border radius style: ${context.style.borderRadius.join(', ')}`);
  }

  // Visual effects
  lines.push(`- Uses gradients: ${context.style.hasGradients ? 'Yes - prefer gradient backgrounds when appropriate' : 'No - use solid colors'}`);
  lines.push(`- Uses shadows: ${context.style.hasShadows ? 'Yes - add shadow effects for depth' : 'Minimal/no shadows'}`);

  // Spacing hints
  if (context.spacing.padding.length > 0 || context.spacing.gap.length > 0) {
    const spacingHints = [...context.spacing.padding.slice(0, 3), ...context.spacing.gap.slice(0, 2)];
    if (spacingHints.length > 0) {
      lines.push(`- Common spacing: ${spacingHints.join(', ')}`);
    }
  }

  lines.push('');
  lines.push('IMPORTANT: Use these exact Tailwind classes to maintain visual consistency with the existing design.');

  return lines.join('\n');
}

/**
 * Get a simplified design summary for logging/debugging
 */
export function getDesignSummary(context: DesignContext): string {
  return `Theme: ${context.style.isDarkTheme ? 'Dark' : 'Light'} | ` +
    `Gradients: ${context.style.hasGradients ? 'Yes' : 'No'} | ` +
    `Shadows: ${context.style.hasShadows ? 'Yes' : 'No'} | ` +
    `Accent: ${context.colors.accent[0] || 'none'}`;
}
