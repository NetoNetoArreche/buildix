"use client";

import { useMemo } from "react";
import { Square, Circle } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";
import { colorToHex } from "@/lib/color-utils";

interface BorderSectionProps {
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderRadius: string;
  onBorderChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

const borderStyles = ["none", "solid", "dashed", "dotted", "double"];

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
  onBorderChange,
  hasActiveProperties,
}: BorderSectionProps) {
  const parseValue = (value: string): number => {
    return parseFloat(value) || 0;
  };

  // Convert borderColor to HEX for the color input
  const hexBorderColor = useMemo(() => {
    return colorToHex(borderColor, "#e4e4e7");
  }, [borderColor]);

  return (
    <CollapsibleSection title="Border" icon={<Square className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-3">
        {/* Border Width */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Width</label>
          <NumberInput
            value={parseValue(borderWidth)}
            onChange={(v) => onBorderChange("borderWidth", `${v}px`)}
            min={0}
            max={20}
            unit="px"
          />
        </div>

        {/* Border Style */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Style</label>
          <div className="grid grid-cols-5 gap-1">
            {borderStyles.map((style) => (
              <button
                key={style}
                onClick={() => onBorderChange("borderStyle", style)}
                className={cn(
                  "h-8 rounded-md border text-[10px] font-medium transition-colors hover:bg-muted",
                  borderStyle === style
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
          <label className="text-xs text-muted-foreground">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={hexBorderColor}
              onChange={(e) => onBorderChange("borderColor", e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border bg-transparent"
            />
            <input
              type="text"
              value={borderColor || ""}
              onChange={(e) => onBorderChange("borderColor", e.target.value)}
              placeholder="#e4e4e7"
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onBorderChange("borderColor", color.value)}
                className={cn(
                  "h-5 w-5 rounded border transition-transform hover:scale-110",
                  borderColor === color.value && "ring-2 ring-[hsl(var(--buildix-primary))] ring-offset-1"
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
