"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, RotateCcw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorToHex } from "@/lib/color-utils";
import { tailwindColors } from "@/lib/color-presets";

// Types
type ColorType = "solid" | "linear" | "radial" | "conic";

interface GradientStop {
  color: string;
  opacity: number;
}

interface GradientConfig {
  type: ColorType;
  direction: string;
  from: GradientStop;
  via: GradientStop | null;
  to: GradientStop;
}

interface AdvancedColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  supportGradients?: boolean;
  className?: string;
}

// Preset solid colors - organized by family
const colorFamilies = [
  { name: "Neutral", key: "neutral" },
  { name: "Stone", key: "stone" },
  { name: "Red", key: "red" },
  { name: "Orange", key: "orange" },
  { name: "Amber", key: "amber" },
  { name: "Yellow", key: "yellow" },
  { name: "Green", key: "green" },
  { name: "Teal", key: "teal" },
  { name: "Cyan", key: "cyan" },
  { name: "Blue", key: "blue" },
  { name: "Indigo", key: "indigo" },
  { name: "Violet", key: "violet" },
  { name: "Purple", key: "purple" },
  { name: "Pink", key: "pink" },
  { name: "Rose", key: "rose" },
];

// Quick color shades to show (subset for compact view)
const quickShades = ["50", "200", "400", "500", "600", "800", "950"];

// Preset gradients
const presetGradients = {
  linear: [
    { from: "#667eea", to: "#764ba2", name: "Purple Dream" },
    { from: "#f093fb", to: "#f5576c", name: "Pink Sunset" },
    { from: "#4facfe", to: "#00f2fe", name: "Ocean Blue" },
    { from: "#43e97b", to: "#38f9d7", name: "Fresh Mint" },
    { from: "#fa709a", to: "#fee140", name: "Warm Flame" },
    { from: "#a8edea", to: "#fed6e3", name: "Soft Pink" },
    { from: "#ff9a9e", to: "#fecfef", name: "Rose Garden" },
    { from: "#ffecd2", to: "#fcb69f", name: "Peach" },
    { from: "#667eea", to: "#f093fb", name: "Violet" },
    { from: "#11998e", to: "#38ef7d", name: "Green Beach" },
    { from: "#fc466b", to: "#3f5efb", name: "Cherry Blue" },
    { from: "#0f0c29", via: "#302b63", to: "#24243e", name: "Deep Space" },
  ],
  radial: [
    { from: "#667eea", to: "#764ba2", name: "Purple Center" },
    { from: "#f5af19", to: "#f12711", name: "Sunset Glow" },
    { from: "#00c6ff", to: "#0072ff", name: "Blue Sphere" },
    { from: "#f857a6", to: "#ff5858", name: "Pink Sphere" },
  ],
  conic: [
    { from: "#ff9a9e", via: "#fecfef", to: "#ff9a9e", name: "Rainbow" },
    { from: "#667eea", via: "#764ba2", to: "#667eea", name: "Purple Spin" },
    { from: "#11998e", via: "#38ef7d", to: "#11998e", name: "Green Spin" },
  ],
};

const gradientDirections = [
  { value: "to right", label: "→", angle: "90deg" },
  { value: "to left", label: "←", angle: "270deg" },
  { value: "to bottom", label: "↓", angle: "180deg" },
  { value: "to top", label: "↑", angle: "0deg" },
  { value: "to bottom right", label: "↘", angle: "135deg" },
  { value: "to bottom left", label: "↙", angle: "225deg" },
  { value: "to top right", label: "↗", angle: "45deg" },
  { value: "to top left", label: "↖", angle: "315deg" },
];

// Helper to parse color with opacity
function parseColorWithOpacity(colorStr: string): { color: string; opacity: number } {
  const rgbaMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { color: hex, opacity: Math.round(a * 100) };
  }

  if (colorStr.startsWith("#") && colorStr.length === 9) {
    const alpha = parseInt(colorStr.slice(7, 9), 16) / 255;
    return { color: colorStr.slice(0, 7), opacity: Math.round(alpha * 100) };
  }

  return { color: colorStr || "#ffffff", opacity: 100 };
}

// Helper to create color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  if (opacity >= 100) return color;
  const hex = colorToHex(color, "#ffffff");
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Parse existing value to detect type
function parseValue(value: string): { type: ColorType; config: GradientConfig | null; solidColor: string; solidOpacity: number } {
  if (!value) {
    return {
      type: "solid",
      config: null,
      solidColor: "#ffffff",
      solidOpacity: 100,
    };
  }

  // Linear gradient
  if (value.includes("linear-gradient")) {
    const match = value.match(/linear-gradient\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*(?:,\s*([^,]+))?\s*(?:,\s*([^)]+))?\s*\)/i);
    if (match) {
      const direction = match[1] || "to right";
      const colors = [match[2], match[3], match[4]].filter(Boolean).map(c => c?.trim());
      return {
        type: "linear",
        config: {
          type: "linear",
          direction,
          from: parseColorWithOpacity(colors[0] || "#ffffff"),
          via: colors.length > 2 ? parseColorWithOpacity(colors[1] || "#ffffff") : null,
          to: parseColorWithOpacity(colors[colors.length - 1] || "#000000"),
        },
        solidColor: "#ffffff",
        solidOpacity: 100,
      };
    }
  }

  // Radial gradient
  if (value.includes("radial-gradient")) {
    const match = value.match(/radial-gradient\s*\(\s*(?:circle\s*(?:at\s*[^,]+)?\s*,\s*)?([^,]+)\s*(?:,\s*([^,]+))?\s*(?:,\s*([^)]+))?\s*\)/i);
    if (match) {
      const colors = [match[1], match[2], match[3]].filter(Boolean).map(c => c?.trim());
      return {
        type: "radial",
        config: {
          type: "radial",
          direction: "circle",
          from: parseColorWithOpacity(colors[0] || "#ffffff"),
          via: colors.length > 2 ? parseColorWithOpacity(colors[1] || "#ffffff") : null,
          to: parseColorWithOpacity(colors[colors.length - 1] || "#000000"),
        },
        solidColor: "#ffffff",
        solidOpacity: 100,
      };
    }
  }

  // Conic gradient
  if (value.includes("conic-gradient")) {
    const match = value.match(/conic-gradient\s*\(\s*(?:from\s+([^,]+)\s*,\s*)?([^,]+)\s*(?:,\s*([^,]+))?\s*(?:,\s*([^)]+))?\s*\)/i);
    if (match) {
      const colors = [match[2], match[3], match[4]].filter(Boolean).map(c => c?.trim());
      return {
        type: "conic",
        config: {
          type: "conic",
          direction: match[1] || "0deg",
          from: parseColorWithOpacity(colors[0] || "#ffffff"),
          via: colors.length > 2 ? parseColorWithOpacity(colors[1] || "#ffffff") : null,
          to: parseColorWithOpacity(colors[colors.length - 1] || "#000000"),
        },
        solidColor: "#ffffff",
        solidOpacity: 100,
      };
    }
  }

  // Solid color
  const parsed = parseColorWithOpacity(value);
  return {
    type: "solid",
    config: null,
    solidColor: parsed.color,
    solidOpacity: parsed.opacity,
  };
}

// Build gradient CSS string
function buildGradient(config: GradientConfig): string {
  const fromColor = colorWithOpacity(config.from.color, config.from.opacity);
  const toColor = colorWithOpacity(config.to.color, config.to.opacity);
  const viaColor = config.via ? colorWithOpacity(config.via.color, config.via.opacity) : null;
  const colors = viaColor ? `${fromColor}, ${viaColor}, ${toColor}` : `${fromColor}, ${toColor}`;

  switch (config.type) {
    case "linear":
      return `linear-gradient(${config.direction}, ${colors})`;
    case "radial":
      return `radial-gradient(circle, ${colors})`;
    case "conic":
      return `conic-gradient(from ${config.direction}, ${colors})`;
    default:
      return fromColor;
  }
}

// Color Stop Input Component
function ColorStopInput({
  label,
  color,
  opacity,
  onColorChange,
  onOpacityChange,
}: {
  label: string;
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
}) {
  const hexColor = useMemo(() => colorToHex(color, "#ffffff"), [color]);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground w-6 flex-shrink-0">{label}</span>
      <input
        type="color"
        value={hexColor}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-5 w-5 cursor-pointer rounded border bg-transparent flex-shrink-0"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        placeholder="#fff"
        className="h-6 flex-1 rounded border bg-transparent px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
      />
      <input
        type="number"
        min={0}
        max={100}
        value={opacity}
        onChange={(e) => onOpacityChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
        className="h-6 w-10 rounded border bg-transparent px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring text-center flex-shrink-0"
      />
      <span className="text-[10px] text-muted-foreground">%</span>
    </div>
  );
}

export function AdvancedColorPicker({
  value,
  onChange,
  supportGradients = true,
  className,
}: AdvancedColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [gradientPage, setGradientPage] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Parse current value
  const parsed = useMemo(() => parseValue(value), [value]);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is inside the dropdown or trigger
      if (
        triggerRef.current?.contains(target) ||
        target.closest('[data-color-picker-dropdown]')
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Local state
  const [colorType, setColorType] = useState<ColorType>(parsed.type);
  const [solidColor, setSolidColor] = useState(parsed.solidColor);
  const [solidOpacity, setSolidOpacity] = useState(parsed.solidOpacity);
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>(
    parsed.config || {
      type: "linear",
      direction: "to right",
      from: { color: "#ffffff", opacity: 100 },
      via: null,
      to: { color: "#000000", opacity: 100 },
    }
  );

  // Sync local state when value changes externally
  useEffect(() => {
    const newParsed = parseValue(value);
    setColorType(newParsed.type);
    setSolidColor(newParsed.solidColor);
    setSolidOpacity(newParsed.solidOpacity);
    if (newParsed.config) {
      setGradientConfig(newParsed.config);
    }
  }, [value]);

  const hexSolidColor = useMemo(() => colorToHex(solidColor, "#ffffff"), [solidColor]);

  // Handle type change
  const handleTypeChange = useCallback((type: ColorType) => {
    setColorType(type);
    if (type === "solid") {
      const newValue = solidOpacity < 100 ? colorWithOpacity(solidColor, solidOpacity) : solidColor;
      onChange(newValue);
    } else {
      const newConfig = { ...gradientConfig, type };
      setGradientConfig(newConfig);
      onChange(buildGradient(newConfig));
    }
  }, [solidColor, solidOpacity, gradientConfig, onChange]);

  // Handle solid color change
  const handleSolidColorChange = useCallback((color: string) => {
    setSolidColor(color);
    const newValue = solidOpacity < 100 ? colorWithOpacity(color, solidOpacity) : color;
    onChange(newValue);
  }, [solidOpacity, onChange]);

  // Handle solid opacity change
  const handleSolidOpacityChange = useCallback((opacity: number) => {
    setSolidOpacity(opacity);
    const newValue = opacity < 100 ? colorWithOpacity(solidColor, opacity) : solidColor;
    onChange(newValue);
  }, [solidColor, onChange]);

  // Update gradient config
  const updateGradient = useCallback((updates: Partial<GradientConfig>) => {
    const newConfig = { ...gradientConfig, ...updates };
    setGradientConfig(newConfig);
    onChange(buildGradient(newConfig));
  }, [gradientConfig, onChange]);

  // Update gradient stop
  const updateGradientStop = useCallback((stop: "from" | "via" | "to", updates: Partial<GradientStop>) => {
    const currentStop = stop === "via" ? gradientConfig.via : gradientConfig[stop];
    const newStop = { ...currentStop!, ...updates };

    if (stop === "via") {
      updateGradient({ via: newStop });
    } else {
      updateGradient({ [stop]: newStop });
    }
  }, [gradientConfig, updateGradient]);

  // Toggle via color
  const toggleVia = useCallback(() => {
    if (gradientConfig.via) {
      updateGradient({ via: null });
    } else {
      updateGradient({ via: { color: "#ffffff", opacity: 100 } });
    }
  }, [gradientConfig, updateGradient]);

  // Apply preset gradient
  const applyPresetGradient = (preset: { from: string; via?: string; to: string }) => {
    const newConfig: GradientConfig = {
      ...gradientConfig,
      from: { color: preset.from, opacity: 100 },
      via: preset.via ? { color: preset.via, opacity: 100 } : null,
      to: { color: preset.to, opacity: 100 },
    };
    setGradientConfig(newConfig);
    onChange(buildGradient(newConfig));
  };

  const currentPresets = colorType !== "solid"
    ? presetGradients[colorType as keyof typeof presetGradients] || presetGradients.linear
    : [];

  const presetsPerPage = 8;
  const totalPages = Math.ceil(currentPresets.length / presetsPerPage);
  const displayedPresets = currentPresets.slice(gradientPage * presetsPerPage, (gradientPage + 1) * presetsPerPage);

  // Get preview background
  const previewBackground = useMemo(() => {
    if (colorType === "solid") {
      return solidOpacity < 100 ? colorWithOpacity(solidColor, solidOpacity) : solidColor;
    }
    return buildGradient(gradientConfig);
  }, [colorType, solidColor, solidOpacity, gradientConfig]);

  // Get display value
  const displayValue = useMemo(() => {
    if (colorType === "solid") {
      if (solidOpacity < 100) {
        return `${solidColor} / ${solidOpacity}%`;
      }
      return solidColor;
    }
    return colorType.charAt(0).toUpperCase() + colorType.slice(1) + " gradient";
  }, [colorType, solidColor, solidOpacity]);

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 w-full rounded-md border bg-background px-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <div
          className="h-5 w-5 rounded border flex-shrink-0"
          style={{
            background: previewBackground,
            backgroundImage: solidColor === "transparent" || value === "transparent"
              ? `linear-gradient(45deg, #ccc 25%, transparent 25%),
                 linear-gradient(-45deg, #ccc 25%, transparent 25%),
                 linear-gradient(45deg, transparent 75%, #ccc 75%),
                 linear-gradient(-45deg, transparent 75%, #ccc 75%)`
              : undefined,
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        />
        <span className="flex-1 text-left text-xs truncate">{displayValue}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Panel - rendered via Portal to escape overflow:hidden */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          data-color-picker-dropdown
          className="fixed z-[9999] w-72 rounded-lg border bg-popover shadow-xl"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {/* Header with close */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-medium">Color Picker</span>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tabs */}
          {supportGradients && (
            <div className="flex p-1 mx-2 mt-2 rounded-md bg-muted/50">
              {(["solid", "linear", "radial", "conic"] as ColorType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "flex-1 rounded-sm px-2 py-1 text-[10px] font-medium transition-colors capitalize",
                    colorType === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 space-y-3">
            {/* Solid Color */}
            {colorType === "solid" && (
              <>
                {/* Color families */}
                <div className="space-y-2">
                  {/* Family selector */}
                  <div className="flex flex-wrap gap-1">
                    {colorFamilies.slice(0, 10).map((family) => {
                      const familyColor = tailwindColors[family.key]?.["500"] || "#666";
                      return (
                        <button
                          key={family.key}
                          onClick={() => setSelectedFamily(selectedFamily === family.key ? null : family.key)}
                          className={cn(
                            "h-5 w-5 rounded-full border transition-transform hover:scale-110",
                            selectedFamily === family.key && "ring-2 ring-offset-1 ring-[hsl(var(--buildix-primary))]"
                          )}
                          style={{ backgroundColor: familyColor }}
                          title={family.name}
                        />
                      );
                    })}
                  </div>

                  {/* Show more families */}
                  <div className="flex flex-wrap gap-1">
                    {colorFamilies.slice(10).map((family) => {
                      const familyColor = tailwindColors[family.key]?.["500"] || "#666";
                      return (
                        <button
                          key={family.key}
                          onClick={() => setSelectedFamily(selectedFamily === family.key ? null : family.key)}
                          className={cn(
                            "h-5 w-5 rounded-full border transition-transform hover:scale-110",
                            selectedFamily === family.key && "ring-2 ring-offset-1 ring-[hsl(var(--buildix-primary))]"
                          )}
                          style={{ backgroundColor: familyColor }}
                          title={family.name}
                        />
                      );
                    })}
                  </div>

                  {/* Selected family shades */}
                  {selectedFamily && tailwindColors[selectedFamily] && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-muted-foreground capitalize">{selectedFamily}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(tailwindColors[selectedFamily]).map(([shade, hex]) => (
                          <button
                            key={shade}
                            onClick={() => handleSolidColorChange(hex)}
                            className={cn(
                              "h-5 w-5 rounded border transition-transform hover:scale-110",
                              solidColor.toLowerCase() === hex.toLowerCase() && "ring-2 ring-offset-1 ring-[hsl(var(--buildix-primary))]"
                            )}
                            style={{ backgroundColor: hex }}
                            title={`${selectedFamily}-${shade}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom color input */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <input
                    type="color"
                    value={hexSolidColor}
                    onChange={(e) => handleSolidColorChange(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={solidColor}
                    onChange={(e) => handleSolidColorChange(e.target.value)}
                    placeholder="#ffffff"
                    className="h-7 flex-1 rounded border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={solidOpacity}
                      onChange={(e) => handleSolidOpacityChange(parseInt(e.target.value) || 0)}
                      className="h-7 w-12 rounded border bg-transparent px-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring text-center"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>
              </>
            )}

            {/* Gradient Options */}
            {colorType !== "solid" && (
              <>
                {/* Preset Gradients */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Presets</span>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <button
                          onClick={() => setGradientPage(Math.max(0, gradientPage - 1))}
                          disabled={gradientPage === 0}
                          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                        >
                          <ChevronLeft className="h-2.5 w-2.5" />
                        </button>
                        <span>{gradientPage + 1}/{totalPages}</span>
                        <button
                          onClick={() => setGradientPage(Math.min(totalPages - 1, gradientPage + 1))}
                          disabled={gradientPage >= totalPages - 1}
                          className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                        >
                          <ChevronRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {displayedPresets.map((preset, idx) => {
                      const gradient = colorType === "linear"
                        ? `linear-gradient(to right, ${preset.from}, ${"via" in preset ? preset.via + ", " : ""}${preset.to})`
                        : colorType === "radial"
                        ? `radial-gradient(circle, ${preset.from}, ${preset.to})`
                        : `conic-gradient(${preset.from}, ${"via" in preset ? preset.via + ", " : ""}${preset.to})`;

                      return (
                        <button
                          key={idx}
                          onClick={() => applyPresetGradient(preset as { from: string; via?: string; to: string })}
                          className="h-6 w-6 rounded-full border transition-transform hover:scale-110"
                          style={{ background: gradient }}
                          title={preset.name}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Direction (for linear gradients) */}
                {colorType === "linear" && (
                  <div className="space-y-1.5 pt-2 border-t">
                    <label className="text-[10px] text-muted-foreground">Direction</label>
                    <div className="flex flex-wrap gap-1">
                      {gradientDirections.map((dir) => (
                        <button
                          key={dir.value}
                          onClick={() => updateGradient({ direction: dir.value })}
                          className={cn(
                            "h-7 w-7 rounded border text-xs flex items-center justify-center transition-colors",
                            gradientConfig.direction === dir.value
                              ? "bg-[hsl(var(--buildix-primary))] text-white border-[hsl(var(--buildix-primary))]"
                              : "hover:bg-muted"
                          )}
                          title={dir.label}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conic angle */}
                {colorType === "conic" && (
                  <div className="space-y-1 pt-2 border-t">
                    <label className="text-[10px] text-muted-foreground">Start Angle</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={parseInt(gradientConfig.direction) || 0}
                        onChange={(e) => updateGradient({ direction: `${e.target.value}deg` })}
                        className="flex-1 h-1"
                      />
                      <span className="text-[10px] text-muted-foreground w-10 text-right">
                        {gradientConfig.direction}
                      </span>
                    </div>
                  </div>
                )}

                {/* Color Stops */}
                <div className="space-y-1.5 pt-2 border-t">
                  <ColorStopInput
                    label="From"
                    color={gradientConfig.from.color}
                    opacity={gradientConfig.from.opacity}
                    onColorChange={(c) => updateGradientStop("from", { color: c })}
                    onOpacityChange={(o) => updateGradientStop("from", { opacity: o })}
                  />

                  {/* Via (optional) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleVia}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center text-[8px] transition-colors flex-shrink-0",
                        gradientConfig.via
                          ? "bg-[hsl(var(--buildix-primary))] border-[hsl(var(--buildix-primary))] text-white"
                          : "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {gradientConfig.via ? "✓" : "+"}
                    </button>
                    {gradientConfig.via ? (
                      <div className="flex-1">
                        <ColorStopInput
                          label="Via"
                          color={gradientConfig.via.color}
                          opacity={gradientConfig.via.opacity}
                          onColorChange={(c) => updateGradientStop("via", { color: c })}
                          onOpacityChange={(o) => updateGradientStop("via", { opacity: o })}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Add middle color</span>
                    )}
                  </div>

                  <ColorStopInput
                    label="To"
                    color={gradientConfig.to.color}
                    opacity={gradientConfig.to.opacity}
                    onColorChange={(c) => updateGradientStop("to", { color: c })}
                    onOpacityChange={(o) => updateGradientStop("to", { opacity: o })}
                  />
                </div>

                {/* Reset */}
                <button
                  onClick={() => {
                    const newConfig = {
                      type: colorType,
                      direction: colorType === "conic" ? "0deg" : "to right",
                      from: { color: "#ffffff", opacity: 100 },
                      via: null,
                      to: { color: "#000000", opacity: 100 },
                    };
                    setGradientConfig(newConfig);
                    onChange(buildGradient(newConfig));
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset gradient
                </button>
              </>
            )}

            {/* Preview */}
            <div className="pt-2 border-t">
              <span className="text-[10px] text-muted-foreground">Preview</span>
              <div
                className="h-8 w-full rounded border mt-1"
                style={{ background: previewBackground }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
