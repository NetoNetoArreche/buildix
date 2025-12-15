"use client";

import { useMemo, useCallback } from "react";
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { PropertyRow, PropertyGrid } from "@/components/ui/property-row";
import { AdvancedColorPicker } from "@/components/ui/advanced-color-picker";
import { cn } from "@/lib/utils";

interface TypographySectionProps {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  color: string;
  onTypographyChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

const fontFamilies = [
  // Sans-serif (Modern)
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Lato", value: "Lato, sans-serif" },
  { name: "Montserrat", value: "Montserrat, sans-serif" },
  { name: "Poppins", value: "Poppins, sans-serif" },
  { name: "Nunito", value: "Nunito, sans-serif" },
  { name: "Raleway", value: "Raleway, sans-serif" },
  { name: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { name: "DM Sans", value: "'DM Sans', sans-serif" },
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Manrope", value: "Manrope, sans-serif" },
  { name: "Outfit", value: "Outfit, sans-serif" },
  { name: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  // System fonts
  { name: "System UI", value: "system-ui, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  // Serif (Elegant)
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "Merriweather", value: "Merriweather, serif" },
  { name: "Lora", value: "Lora, serif" },
  { name: "Cormorant", value: "Cormorant, serif" },
  // Monospace (Code)
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { name: "Fira Code", value: "'Fira Code', monospace" },
  { name: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { name: "Courier New", value: "'Courier New', monospace" },
  { name: "Monospace", value: "monospace" },
  // Display (Headlines)
  { name: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { name: "Oswald", value: "Oswald, sans-serif" },
  { name: "Anton", value: "Anton, sans-serif" },
];

const fontWeights = [
  { label: "Thin", value: "100" },
  { label: "Light", value: "300" },
  { label: "Normal", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Black", value: "900" },
];

export function TypographySection({
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textAlign,
  color,
  onTypographyChange,
  activeProperties = {},
  hasActiveProperties,
}: TypographySectionProps) {
  const parseValue = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "" : num;
  };

  // Handle color change - for gradients, we need to apply text gradient technique
  const handleColorChange = useCallback((newColor: string) => {
    // Check if it's a gradient (linear, radial, or conic)
    const isGradient = newColor.includes("gradient");

    if (isGradient) {
      // For text gradients, we pass a special marker that the right-panel will handle
      // The right-panel's applyLiveStyleToCanvas will apply the background-clip technique
      onTypographyChange("color", newColor);
    } else {
      // Solid color - apply directly
      onTypographyChange("color", newColor);
    }
  }, [onTypographyChange]);

  // Find the matching font value from the list, or return the raw fontFamily
  // This handles cases where fontFamily is just the name (e.g., "Playfair Display")
  // but the select options have full values (e.g., "'Playfair Display', serif")
  const normalizedFontFamily = useMemo(() => {
    if (!fontFamily) return "";

    // Check if the fontFamily already matches a value in the list
    const exactMatch = fontFamilies.find(f => f.value === fontFamily);
    if (exactMatch) return exactMatch.value;

    // Check if the fontFamily matches a name in the list
    const nameMatch = fontFamilies.find(f =>
      f.name.toLowerCase() === fontFamily.toLowerCase() ||
      f.name.toLowerCase().includes(fontFamily.toLowerCase()) ||
      fontFamily.toLowerCase().includes(f.name.toLowerCase())
    );
    if (nameMatch) return nameMatch.value;

    // Return the original value (will show as "current" option)
    return fontFamily;
  }, [fontFamily]);

  const alignments = [
    { icon: AlignLeft, value: "left" },
    { icon: AlignCenter, value: "center" },
    { icon: AlignRight, value: "right" },
    { icon: AlignJustify, value: "justify" },
  ];

  return (
    <CollapsibleSection title="Typography" icon={<Type className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-3">
        {/* Font Family */}
        <PropertyRow label="Font Family" isActive={activeProperties.fontFamily}>
          <select
            value={normalizedFontFamily}
            onChange={(e) => onTypographyChange("fontFamily", e.target.value)}
            className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring [&>optgroup]:bg-background [&>optgroup]:text-foreground [&>option]:bg-background [&>option]:text-foreground"
          >
            {/* Show current font if it's not in the list */}
            {normalizedFontFamily && !fontFamilies.some(f => f.value === normalizedFontFamily) && (
              <option value={normalizedFontFamily}>{fontFamily} (current)</option>
            )}
            <option value="">Inherited</option>
            <optgroup label="Sans-serif (Modern)">
              {fontFamilies.slice(0, 14).map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="System">
              {fontFamilies.slice(14, 17).map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Serif (Elegant)">
              {fontFamilies.slice(17, 23).map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Monospace (Code)">
              {fontFamilies.slice(23, 28).map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Display (Headlines)">
              {fontFamilies.slice(28).map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </optgroup>
          </select>
        </PropertyRow>

        {/* Font Size & Weight */}
        <PropertyGrid>
          <PropertyRow label="Size" isActive={activeProperties.fontSize}>
            <NumberInput
              value={parseValue(fontSize)}
              onChange={(v) => onTypographyChange("fontSize", `${v}px`)}
              unit="px"
              units={["px", "rem", "em"]}
              onUnitChange={(u) => onTypographyChange("fontSize", `${parseValue(fontSize)}${u}`)}
              placeholder="16"
            />
          </PropertyRow>
          <PropertyRow label="Weight" isActive={activeProperties.fontWeight}>
            <select
              value={fontWeight || "400"}
              onChange={(e) => onTypographyChange("fontWeight", e.target.value)}
              className="h-8 w-full rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
            >
              {fontWeights.map((weight) => (
                <option key={weight.value} value={weight.value}>
                  {weight.label}
                </option>
              ))}
            </select>
          </PropertyRow>
        </PropertyGrid>

        {/* Line Height & Letter Spacing */}
        <PropertyGrid>
          <PropertyRow label="Line Height" isActive={activeProperties.lineHeight}>
            <NumberInput
              value={parseValue(lineHeight)}
              onChange={(v) => onTypographyChange("lineHeight", String(v))}
              placeholder="1.5"
              step={0.1}
              allowEmpty
            />
          </PropertyRow>
          <PropertyRow label="Letter Spacing" isActive={activeProperties.letterSpacing}>
            <NumberInput
              value={parseValue(letterSpacing)}
              onChange={(v) => onTypographyChange("letterSpacing", `${v}px`)}
              placeholder="0"
              unit="px"
              step={0.5}
              allowEmpty
            />
          </PropertyRow>
        </PropertyGrid>

        {/* Text Align */}
        <PropertyRow label="Alignment" isActive={activeProperties.textAlign}>
          <div className="flex gap-1">
            {alignments.map(({ icon: Icon, value }) => (
              <button
                key={value}
                onClick={() => onTypographyChange("textAlign", value)}
                className={cn(
                  "flex h-8 flex-1 items-center justify-center rounded-md border transition-colors",
                  textAlign === value
                    ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10 text-[hsl(var(--buildix-primary))]"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </PropertyRow>

        {/* Text Color - Advanced color picker with gradient support */}
        <PropertyRow label="Color" isActive={activeProperties.color}>
          <AdvancedColorPicker
            value={color || "#000000"}
            onChange={handleColorChange}
            supportGradients={true}
          />
        </PropertyRow>
      </div>
    </CollapsibleSection>
  );
}
