"use client";

import { useEffect, useMemo, useState } from "react";
import { Square } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";
import { colorToHex } from "@/lib/color-utils";

interface BorderSectionProps {
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderRadius: string;
  // Individual border sides - width
  borderTopWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderRightWidth?: string;
  // Individual border sides - style
  borderTopStyle?: string;
  borderBottomStyle?: string;
  borderLeftStyle?: string;
  borderRightStyle?: string;
  // Individual border sides - color
  borderTopColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderRightColor?: string;
  onBorderChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

const borderStyles = ["none", "solid", "dashed", "dotted", "double"];

type BorderSide = "all" | "top" | "bottom" | "left" | "right";

const presetColors = [
  { name: "Zinc 200", value: "#e4e4e7" },
  { name: "Zinc 400", value: "#a1a1aa" },
  { name: "Zinc 600", value: "#52525b" },
  { name: "Zinc 800", value: "#27272a" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Transparent", value: "transparent" },
];

const radiusPresets = [
  { name: "None", value: "0" },
  { name: "SM", value: "0.125rem" },
  { name: "MD", value: "0.375rem" },
  { name: "LG", value: "0.5rem" },
  { name: "XL", value: "0.75rem" },
  { name: "2XL", value: "1rem" },
  { name: "Full", value: "9999px" },
];

export function BorderSection({
  borderWidth,
  borderStyle,
  borderColor,
  borderRadius,
  borderTopWidth,
  borderBottomWidth,
  borderLeftWidth,
  borderRightWidth,
  borderTopStyle,
  borderBottomStyle,
  borderLeftStyle,
  borderRightStyle,
  borderTopColor,
  borderBottomColor,
  borderLeftColor,
  borderRightColor,
  onBorderChange,
  hasActiveProperties,
}: BorderSectionProps) {
  // Detect which side has a border and auto-select it
  const detectActiveSide = (): BorderSide => {
    const hasTop = borderTopWidth && parseFloat(borderTopWidth) > 0;
    const hasBottom = borderBottomWidth && parseFloat(borderBottomWidth) > 0;
    const hasLeft = borderLeftWidth && parseFloat(borderLeftWidth) > 0;
    const hasRight = borderRightWidth && parseFloat(borderRightWidth) > 0;
    const hasAll = borderWidth && parseFloat(borderWidth) > 0;

    // If only one side has border, select that side
    const sidesWithBorder = [hasTop, hasBottom, hasLeft, hasRight].filter(Boolean).length;

    if (hasAll && sidesWithBorder === 0) return "all";
    if (sidesWithBorder === 1) {
      if (hasTop) return "top";
      if (hasBottom) return "bottom";
      if (hasLeft) return "left";
      if (hasRight) return "right";
    }

    return "all";
  };

  const [activeSide, setActiveSide] = useState<BorderSide>(detectActiveSide);

  // Update active side when selected element changes (border properties change)
  useEffect(() => {
    setActiveSide(detectActiveSide());
  }, [borderWidth, borderTopWidth, borderBottomWidth, borderLeftWidth, borderRightWidth]);

  const parseValue = (value: string): number => {
    return parseFloat(value) || 0;
  };

  // Get the current width based on active side
  const getCurrentWidth = (): number => {
    switch (activeSide) {
      case "top":
        return parseValue(borderTopWidth || borderWidth);
      case "bottom":
        return parseValue(borderBottomWidth || borderWidth);
      case "left":
        return parseValue(borderLeftWidth || borderWidth);
      case "right":
        return parseValue(borderRightWidth || borderWidth);
      default:
        return parseValue(borderWidth);
    }
  };

  // Get the current style based on active side
  const getCurrentStyle = (): string => {
    switch (activeSide) {
      case "top":
        return borderTopStyle || borderStyle || "none";
      case "bottom":
        return borderBottomStyle || borderStyle || "none";
      case "left":
        return borderLeftStyle || borderStyle || "none";
      case "right":
        return borderRightStyle || borderStyle || "none";
      default:
        return borderStyle || "none";
    }
  };

  // Get the current color based on active side
  const getCurrentColor = (): string => {
    switch (activeSide) {
      case "top":
        return borderTopColor || borderColor || "transparent";
      case "bottom":
        return borderBottomColor || borderColor || "transparent";
      case "left":
        return borderLeftColor || borderColor || "transparent";
      case "right":
        return borderRightColor || borderColor || "transparent";
      default:
        return borderColor || "transparent";
    }
  };

  // Convert current color to HEX for the color input
  const currentColor = getCurrentColor();
  const hexBorderColor = useMemo(() => {
    return colorToHex(currentColor, "#e4e4e7");
  }, [currentColor]);

  const currentStyle = getCurrentStyle();

  // Handle width change based on active side
  const handleWidthChange = (value: number) => {
    const pxValue = `${value}px`;

    switch (activeSide) {
      case "top":
        // Clear generic border properties first
        onBorderChange("borderWidth", "");
        onBorderChange("borderStyle", "");
        onBorderChange("borderColor", "");
        // Clear other sides
        onBorderChange("borderBottomWidth", "");
        onBorderChange("borderLeftWidth", "");
        onBorderChange("borderRightWidth", "");
        // Set top border
        onBorderChange("borderTopWidth", pxValue);
        onBorderChange("borderTopStyle", borderTopStyle || borderStyle || "solid");
        onBorderChange("borderTopColor", borderTopColor || borderColor || "#e4e4e7");
        break;
      case "bottom":
        // Clear generic border properties first
        onBorderChange("borderWidth", "");
        onBorderChange("borderStyle", "");
        onBorderChange("borderColor", "");
        // Clear other sides
        onBorderChange("borderTopWidth", "");
        onBorderChange("borderLeftWidth", "");
        onBorderChange("borderRightWidth", "");
        // Set bottom border
        onBorderChange("borderBottomWidth", pxValue);
        onBorderChange("borderBottomStyle", borderBottomStyle || borderStyle || "solid");
        onBorderChange("borderBottomColor", borderBottomColor || borderColor || "#e4e4e7");
        break;
      case "left":
        // Clear generic border properties first
        onBorderChange("borderWidth", "");
        onBorderChange("borderStyle", "");
        onBorderChange("borderColor", "");
        // Clear other sides
        onBorderChange("borderTopWidth", "");
        onBorderChange("borderBottomWidth", "");
        onBorderChange("borderRightWidth", "");
        // Set left border
        onBorderChange("borderLeftWidth", pxValue);
        onBorderChange("borderLeftStyle", borderLeftStyle || borderStyle || "solid");
        onBorderChange("borderLeftColor", borderLeftColor || borderColor || "#e4e4e7");
        break;
      case "right":
        // Clear generic border properties first
        onBorderChange("borderWidth", "");
        onBorderChange("borderStyle", "");
        onBorderChange("borderColor", "");
        // Clear other sides
        onBorderChange("borderTopWidth", "");
        onBorderChange("borderBottomWidth", "");
        onBorderChange("borderLeftWidth", "");
        // Set right border
        onBorderChange("borderRightWidth", pxValue);
        onBorderChange("borderRightStyle", borderRightStyle || borderStyle || "solid");
        onBorderChange("borderRightColor", borderRightColor || borderColor || "#e4e4e7");
        break;
      default:
        // All sides - clear individual sides and set generic border
        onBorderChange("borderTopWidth", "");
        onBorderChange("borderBottomWidth", "");
        onBorderChange("borderLeftWidth", "");
        onBorderChange("borderRightWidth", "");
        onBorderChange("borderTopStyle", "");
        onBorderChange("borderBottomStyle", "");
        onBorderChange("borderLeftStyle", "");
        onBorderChange("borderRightStyle", "");
        onBorderChange("borderTopColor", "");
        onBorderChange("borderBottomColor", "");
        onBorderChange("borderLeftColor", "");
        onBorderChange("borderRightColor", "");
        // Set generic border
        onBorderChange("borderWidth", pxValue);
        onBorderChange("borderStyle", borderStyle || "solid");
        onBorderChange("borderColor", borderColor || "#e4e4e7");
    }
  };

  // Handle style change based on active side
  const handleStyleChange = (style: string) => {
    switch (activeSide) {
      case "top":
        onBorderChange("borderTopStyle", style);
        break;
      case "bottom":
        onBorderChange("borderBottomStyle", style);
        break;
      case "left":
        onBorderChange("borderLeftStyle", style);
        break;
      case "right":
        onBorderChange("borderRightStyle", style);
        break;
      default:
        onBorderChange("borderStyle", style);
    }
  };

  // Handle color change based on active side
  const handleColorChange = (color: string) => {
    switch (activeSide) {
      case "top":
        onBorderChange("borderTopColor", color);
        break;
      case "bottom":
        onBorderChange("borderBottomColor", color);
        break;
      case "left":
        onBorderChange("borderLeftColor", color);
        break;
      case "right":
        onBorderChange("borderRightColor", color);
        break;
      default:
        onBorderChange("borderColor", color);
    }
  };

  return (
    <CollapsibleSection title="Border" icon={<Square className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-3">
        {/* Border Side Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Apply to</label>
          <div className="flex items-center gap-1">
            {/* Visual Border Selector */}
            <div className="relative w-12 h-12 border border-border rounded-md bg-muted/30 mr-2">
              {/* Center - All sides */}
              <button
                onClick={() => setActiveSide("all")}
                className={cn(
                  "absolute inset-2 rounded-sm transition-colors",
                  activeSide === "all"
                    ? "bg-[hsl(var(--buildix-primary))]"
                    : "bg-muted hover:bg-muted-foreground/20"
                )}
                title="All sides"
              />
              {/* Top */}
              <button
                onClick={() => setActiveSide("top")}
                className={cn(
                  "absolute top-0 left-2 right-2 h-1.5 rounded-t-sm transition-colors",
                  activeSide === "top"
                    ? "bg-[hsl(var(--buildix-primary))]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title="Top"
              />
              {/* Bottom */}
              <button
                onClick={() => setActiveSide("bottom")}
                className={cn(
                  "absolute bottom-0 left-2 right-2 h-1.5 rounded-b-sm transition-colors",
                  activeSide === "bottom"
                    ? "bg-[hsl(var(--buildix-primary))]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title="Bottom"
              />
              {/* Left */}
              <button
                onClick={() => setActiveSide("left")}
                className={cn(
                  "absolute left-0 top-2 bottom-2 w-1.5 rounded-l-sm transition-colors",
                  activeSide === "left"
                    ? "bg-[hsl(var(--buildix-primary))]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title="Left"
              />
              {/* Right */}
              <button
                onClick={() => setActiveSide("right")}
                className={cn(
                  "absolute right-0 top-2 bottom-2 w-1.5 rounded-r-sm transition-colors",
                  activeSide === "right"
                    ? "bg-[hsl(var(--buildix-primary))]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                title="Right"
              />
            </div>
            {/* Text buttons */}
            <div className="flex flex-wrap gap-1 flex-1">
              {(["all", "top", "bottom", "left", "right"] as BorderSide[]).map((side) => (
                <button
                  key={side}
                  onClick={() => setActiveSide(side)}
                  className={cn(
                    "h-7 px-2 rounded text-xs font-medium capitalize transition-colors",
                    activeSide === side
                      ? "bg-[hsl(var(--buildix-primary))]/10 text-[hsl(var(--buildix-primary))] border border-[hsl(var(--buildix-primary))]/30"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Border Width */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Width {activeSide !== "all" && <span className="text-[hsl(var(--buildix-primary))]">({activeSide})</span>}
          </label>
          <NumberInput
            value={getCurrentWidth()}
            onChange={handleWidthChange}
            min={0}
            max={20}
            unit="px"
          />
        </div>

        {/* Border Style */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Style {activeSide !== "all" && <span className="text-[hsl(var(--buildix-primary))]">({activeSide})</span>}
          </label>
          <div className="grid grid-cols-5 gap-1">
            {borderStyles.map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                className={cn(
                  "h-8 rounded-md border text-[10px] font-medium transition-colors hover:bg-muted",
                  currentStyle === style
                    ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10 text-[hsl(var(--buildix-primary))]"
                    : "border-border"
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Border Color */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Color {activeSide !== "all" && <span className="text-[hsl(var(--buildix-primary))]">({activeSide})</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={hexBorderColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border bg-transparent"
            />
            <input
              type="text"
              value={currentColor || ""}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#e4e4e7"
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={cn(
                  "h-5 w-5 rounded border transition-transform hover:scale-110",
                  currentColor === color.value && "ring-2 ring-[hsl(var(--buildix-primary))] ring-offset-1"
                )}
                style={{ backgroundColor: color.value === "transparent" ? "transparent" : color.value }}
                title={color.name}
              >
                {color.value === "transparent" && (
                  <span className="flex h-full w-full items-center justify-center text-[8px] text-muted-foreground">
                    ∅
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Radius</label>
          <div className="flex gap-2">
            <NumberInput
              value={parseValue(borderRadius)}
              onChange={(v) => onBorderChange("borderRadius", `${v}px`)}
              min={0}
              max={100}
              unit="px"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {radiusPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onBorderChange("borderRadius", preset.value)}
                className={cn(
                  "h-7 px-2 rounded text-xs font-medium transition-colors hover:bg-muted",
                  borderRadius === preset.value
                    ? "bg-[hsl(var(--buildix-primary))]/10 text-[hsl(var(--buildix-primary))]"
                    : "bg-muted/50"
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
