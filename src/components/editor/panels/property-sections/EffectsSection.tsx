"use client";

import { Sparkles, Eye, EyeOff } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface EffectsSectionProps {
  opacity: string;
  boxShadow: string;
  filter: string;
  backdropFilter: string;
  mixBlendMode: string;
  cursor: string;
  overflow: string;
  visibility: string;
  onEffectChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

const shadowPresets = [
  { name: "None", value: "none" },
  { name: "SM", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { name: "MD", value: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  { name: "LG", value: "0 10px 15px -3px rgb(0 0 0 / 0.1)" },
  { name: "XL", value: "0 20px 25px -5px rgb(0 0 0 / 0.1)" },
  { name: "2XL", value: "0 25px 50px -12px rgb(0 0 0 / 0.25)" },
  { name: "Inner", value: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" },
];

const blendModes = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference"
];

const cursorTypes = [
  "auto", "default", "pointer", "wait", "text", "move",
  "not-allowed", "grab", "grabbing", "crosshair"
];

const overflowTypes = ["visible", "hidden", "scroll", "auto"];

export function EffectsSection({
  opacity,
  boxShadow,
  filter,
  backdropFilter,
  mixBlendMode,
  cursor,
  overflow,
  visibility,
  onEffectChange,
  hasActiveProperties,
}: EffectsSectionProps) {
  const opacityValue = parseFloat(opacity) || 1;

  // Parse filter values
  const parseFilterValue = (filterStr: string, filterType: string): number => {
    const regex = new RegExp(`${filterType}\\(([\\d.]+)`);
    const match = filterStr?.match(regex);
    return match ? parseFloat(match[1]) : filterType === "blur" ? 0 : 100;
  };

  const blurValue = parseFilterValue(filter, "blur");
  const brightnessValue = parseFilterValue(filter, "brightness");
  const contrastValue = parseFilterValue(filter, "contrast");
  const saturateValue = parseFilterValue(filter, "saturate");

  const updateFilter = (filterType: string, value: number, unit: string = "") => {
    // Build new filter string
    const filters: Record<string, string> = {};

    if (blurValue > 0 || filterType === "blur") {
      filters.blur = `blur(${filterType === "blur" ? value : blurValue}px)`;
    }
    if (brightnessValue !== 100 || filterType === "brightness") {
      filters.brightness = `brightness(${filterType === "brightness" ? value : brightnessValue}%)`;
    }
    if (contrastValue !== 100 || filterType === "contrast") {
      filters.contrast = `contrast(${filterType === "contrast" ? value : contrastValue}%)`;
    }
    if (saturateValue !== 100 || filterType === "saturate") {
      filters.saturate = `saturate(${filterType === "saturate" ? value : saturateValue}%)`;
    }

    const filterString = Object.values(filters).join(" ").trim() || "none";
    onEffectChange("filter", filterString);
  };

  return (
    <CollapsibleSection title="Effects" icon={<Sparkles className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-4">
        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Opacity</label>
            <span className="text-xs text-muted-foreground">{Math.round(opacityValue * 100)}%</span>
          </div>
          <Slider
            value={[opacityValue * 100]}
            onValueChange={([v]) => onEffectChange("opacity", String(v / 100))}
            min={0}
            max={100}
            step={1}
          />
        </div>

        {/* Box Shadow */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Shadow</label>
          <div className="flex flex-wrap gap-1">
            {shadowPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onEffectChange("boxShadow", preset.value)}
                className={cn(
                  "h-7 px-2 rounded text-xs font-medium transition-colors hover:bg-muted",
                  boxShadow === preset.value
                    ? "bg-[hsl(var(--buildix-primary))]/10 text-[hsl(var(--buildix-primary))]"
                    : "bg-muted/50"
                )}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={boxShadow || "none"}
            onChange={(e) => onEffectChange("boxShadow", e.target.value)}
            placeholder="Custom shadow..."
            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Filters</label>

          {/* Blur */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Blur</span>
              <span className="text-[10px] text-muted-foreground">{blurValue}px</span>
            </div>
            <Slider
              value={[blurValue]}
              onValueChange={([v]) => updateFilter("blur", v)}
              min={0}
              max={20}
              step={0.5}
            />
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Brightness</span>
              <span className="text-[10px] text-muted-foreground">{brightnessValue}%</span>
            </div>
            <Slider
              value={[brightnessValue]}
              onValueChange={([v]) => updateFilter("brightness", v)}
              min={0}
              max={200}
              step={5}
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Contrast</span>
              <span className="text-[10px] text-muted-foreground">{contrastValue}%</span>
            </div>
            <Slider
              value={[contrastValue]}
              onValueChange={([v]) => updateFilter("contrast", v)}
              min={0}
              max={200}
              step={5}
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Saturation</span>
              <span className="text-[10px] text-muted-foreground">{saturateValue}%</span>
            </div>
            <Slider
              value={[saturateValue]}
              onValueChange={([v]) => updateFilter("saturate", v)}
              min={0}
              max={200}
              step={5}
            />
          </div>
        </div>

        {/* Blend Mode */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Blend Mode</label>
          <select
            value={mixBlendMode || "normal"}
            onChange={(e) => onEffectChange("mixBlendMode", e.target.value)}
            className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
          >
            {blendModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        {/* Cursor */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Cursor</label>
          <select
            value={cursor || "auto"}
            onChange={(e) => onEffectChange("cursor", e.target.value)}
            className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
          >
            {cursorTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Overflow & Visibility */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Overflow</label>
            <select
              value={overflow || "visible"}
              onChange={(e) => onEffectChange("overflow", e.target.value)}
              className="h-8 w-full rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
            >
              {overflowTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Visibility</label>
            <div className="flex gap-1">
              <button
                onClick={() => onEffectChange("visibility", "visible")}
                className={cn(
                  "flex-1 h-8 rounded-md border flex items-center justify-center transition-colors",
                  visibility !== "hidden"
                    ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10"
                    : "border-border hover:bg-muted"
                )}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEffectChange("visibility", "hidden")}
                className={cn(
                  "flex-1 h-8 rounded-md border flex items-center justify-center transition-colors",
                  visibility === "hidden"
                    ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10"
                    : "border-border hover:bg-muted"
                )}
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
