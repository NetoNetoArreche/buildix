"use client";

import { Maximize2 } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { PropertyRow, PropertyGrid } from "@/components/ui/property-row";

interface SizeSectionProps {
  width: string;
  height: string;
  maxWidth: string;
  maxHeight: string;
  minWidth: string;
  minHeight: string;
  onSizeChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

export function SizeSection({
  width,
  height,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,
  onSizeChange,
  activeProperties = {},
  hasActiveProperties,
}: SizeSectionProps) {
  const units = ["px", "%", "rem", "em", "vw", "vh", "auto"];

  const parseValue = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "" : num;
  };

  const getUnit = (value: string) => {
    if (!value || value === "auto") return "auto";
    const match = value.match(/(px|%|rem|em|vw|vh)$/);
    return match ? match[1] : "px";
  };

  const handleValueChange = (property: string, value: number | string, unit: string) => {
    if (value === "" || unit === "auto") {
      onSizeChange(property, "auto");
    } else {
      onSizeChange(property, `${value}${unit}`);
    }
  };

  return (
    <CollapsibleSection title="Size" icon={<Maximize2 className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-3">
        {/* Width & Height */}
        <PropertyGrid>
          <PropertyRow label="Width" isActive={activeProperties.width}>
            <NumberInput
              value={parseValue(width)}
              onChange={(v) => handleValueChange("width", v, getUnit(width))}
              unit={getUnit(width)}
              units={units}
              onUnitChange={(u) => handleValueChange("width", parseValue(width), u)}
              placeholder="auto"
              allowEmpty
            />
          </PropertyRow>
          <PropertyRow label="Height" isActive={activeProperties.height}>
            <NumberInput
              value={parseValue(height)}
              onChange={(v) => handleValueChange("height", v, getUnit(height))}
              unit={getUnit(height)}
              units={units}
              onUnitChange={(u) => handleValueChange("height", parseValue(height), u)}
              placeholder="auto"
              allowEmpty
            />
          </PropertyRow>
        </PropertyGrid>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {["full", "screen", "auto", "fit"].map((preset) => (
            <button
              key={preset}
              onClick={() => onSizeChange("width", preset === "full" ? "100%" : preset)}
              className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Max Size */}
        <div className="pt-2 border-t border-border/50">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Max Size</label>
          <PropertyGrid>
            <PropertyRow label="Max Width" isActive={activeProperties.maxWidth}>
              <NumberInput
                value={parseValue(maxWidth)}
                onChange={(v) => handleValueChange("maxWidth", v, getUnit(maxWidth))}
                unit={getUnit(maxWidth)}
                units={units}
                onUnitChange={(u) => handleValueChange("maxWidth", parseValue(maxWidth), u)}
                placeholder="none"
                allowEmpty
              />
            </PropertyRow>
            <PropertyRow label="Max Height" isActive={activeProperties.maxHeight}>
              <NumberInput
                value={parseValue(maxHeight)}
                onChange={(v) => handleValueChange("maxHeight", v, getUnit(maxHeight))}
                unit={getUnit(maxHeight)}
                units={units}
                onUnitChange={(u) => handleValueChange("maxHeight", parseValue(maxHeight), u)}
                placeholder="none"
                allowEmpty
              />
            </PropertyRow>
          </PropertyGrid>
        </div>

        {/* Min Size */}
        <div className="pt-2 border-t border-border/50">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Min Size</label>
          <PropertyGrid>
            <PropertyRow label="Min Width" isActive={activeProperties.minWidth}>
              <NumberInput
                value={parseValue(minWidth)}
                onChange={(v) => handleValueChange("minWidth", v, getUnit(minWidth))}
                unit={getUnit(minWidth)}
                units={units}
                onUnitChange={(u) => handleValueChange("minWidth", parseValue(minWidth), u)}
                placeholder="0"
                allowEmpty
              />
            </PropertyRow>
            <PropertyRow label="Min Height" isActive={activeProperties.minHeight}>
              <NumberInput
                value={parseValue(minHeight)}
                onChange={(v) => handleValueChange("minHeight", v, getUnit(minHeight))}
                unit={getUnit(minHeight)}
                units={units}
                onUnitChange={(u) => handleValueChange("minHeight", parseValue(minHeight), u)}
                placeholder="0"
                allowEmpty
              />
            </PropertyRow>
          </PropertyGrid>
        </div>
      </div>
    </CollapsibleSection>
  );
}
