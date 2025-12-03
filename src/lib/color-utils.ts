// Convert any color format (rgb, rgba, hex, named) to HEX for color input
export function colorToHex(color: string, fallback: string = "#ffffff"): string {
  if (!color || color === "transparent" || color === "currentColor") return fallback;

  // Already HEX format
  if (color.startsWith("#")) {
    // Ensure it's a valid 6-digit hex
    if (color.length === 4) {
      // Convert #RGB to #RRGGBB
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return color.slice(0, 7); // Remove alpha if present (#RRGGBBAA -> #RRGGBB)
  }

  // RGB/RGBA format: rgb(255, 213, 0) or rgba(255, 213, 0, 1)
  const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  // For named colors or other formats, try using a canvas to convert
  if (typeof document !== "undefined") {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.fillStyle = color;
        const computed = ctx.fillStyle;
        // ctx.fillStyle normalizes to hex or rgb
        if (computed.startsWith("#")) {
          return computed;
        }
        // If it returned rgb format, parse it
        const match = computed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (match) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        }
      }
    } catch {
      // Fallback
    }
  }

  return fallback;
}
