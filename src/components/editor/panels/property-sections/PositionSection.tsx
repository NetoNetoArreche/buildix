"use client";

import { Move, Grid3X3 } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/utils";

interface PositionSectionProps {
  position: string;
  top: string;
  right: string;
  bottom: string;
  left: string;
  zIndex: string;
  onPositionChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

const positionTypes = [
  { name: "Static", value: "static" },
  { name: "Relative", value: "relative" },
  { name: "Absolute", value: "absolute" },
  { name: "Fixed", value: "fixed" },
  { name: "Sticky", value: "sticky" },
];

const units = ["px", "%", "rem", "em", "vw", "vh"];

export function PositionSection({
  position,
  top,
  right,
  bottom,
  left,
  zIndex,
  onPositionChange,
  hasActiveProperties,
}: PositionSectionProps) {
  const parseValue = (value: string): number => {
    return parseFloat(value) || 0;
  };

  const parseUnit = (value: string): string => {
    const match = value?.match(/[a-z%]+$/);
    return match ? match[0] : "px";
  };

  const isPositioned = position !== "static" && position !== "";

  return (
    <CollapsibleSection title="Position" icon={<Move className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-3">
        {/* Position Type */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Type</label>
          <div className="grid grid-cols-5 gap-1">
            {positionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => onPositionChange("position", type.value)}
                className={cn(
                  "h-8 rounded-md border text-[10px] font-medium transition-colors hover:bg-muted",
                  position === type.value
                    ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10 text-[hsl(var(--buildix-primary))]"
                    : "border-border"
                )}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Position Values - Only show when positioned */}
        {isPositioned && (
          <div className="space-y-2">
            {/* Visual Position Grid */}
            <div className="relative mx-auto w-32 h-32 border border-dashed border-border rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Top Input */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full">
                <input
                  type="text"
                  value={top || "auto"}
                  onChange={(e) => onPositionChange("top", e.target.value)}
                  className="w-14 h-6 text-center text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Right Input */}
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 translate-x-full">
                <input
                  type="text"
                  value={right || "auto"}
                  onChange={(e) => onPositionChange("right", e.target.value)}
                  className="w-14 h-6 text-center text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Bottom Input */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full">
                <input
                  type="text"
                  value={bottom || "auto"}
                  onChange={(e) => onPositionChange("bottom", e.target.value)}
                  className="w-14 h-6 text-center text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Left Input */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 -translate-x-full">
                <input
                  type="text"
                  value={left || "auto"}
                  onChange={(e) => onPositionChange("left", e.target.value)}
                  className="w-14 h-6 text-center text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Detailed Inputs */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Top</label>
                <NumberInput
                  value={parseValue(top)}
                  onChange={(v) => onPositionChange("top", `${v}${parseUnit(top)}`)}
                  unit={parseUnit(top)}
                  units={units}
                  onUnitChange={(u) => onPositionChange("top", `${parseValue(top)}${u}`)}
                  allowEmpty
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Right</label>
                <NumberInput
                  value={parseValue(right)}
                  onChange={(v) => onPositionChange("right", `${v}${parseUnit(right)}`)}
                  unit={parseUnit(right)}
                  units={units}
                  onUnitChange={(u) => onPositionChange("right", `${parseValue(right)}${u}`)}
                  allowEmpty
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Bottom</label>
                <NumberInput
                  value={parseValue(bottom)}
                  onChange={(v) => onPositionChange("bottom", `${v}${parseUnit(bottom)}`)}
                  unit={parseUnit(bottom)}
                  units={units}
                  onUnitChange={(u) => onPositionChange("bottom", `${parseValue(bottom)}${u}`)}
                  allowEmpty
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Left</label>
                <NumberInput
                  value={parseValue(left)}
                  onChange={(v) => onPositionChange("left", `${v}${parseUnit(left)}`)}
                  unit={parseUnit(left)}
                  units={units}
                  onUnitChange={(u) => onPositionChange("left", `${parseValue(left)}${u}`)}
                  allowEmpty
                />
              </div>
            </div>
          </div>
        )}

        {/* Z-Index */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Z-Index</label>
          <NumberInput
            value={parseInt(zIndex) || 0}
            onChange={(v) => onPositionChange("zIndex", String(v))}
            min={-999}
            max={9999}
            showStepper
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
