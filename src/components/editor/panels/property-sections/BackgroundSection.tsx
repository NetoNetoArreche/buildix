"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Paintbrush, Image as ImageIcon, X, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ImageSelectorModal } from "@/components/editor/modals/ImageSelectorModal";
import { AssetBackgroundModal } from "@/components/editor/modals/AssetBackgroundModal";
import { cn } from "@/lib/utils";
import { colorToHex } from "@/lib/color-utils";
import { useEditorStore } from "@/stores/editorStore";
import type { BackgroundAsset } from "@/types";

interface BackgroundSectionProps {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  onBackgroundChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
  // IMG element props
  isImageElement?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  imageObjectFit?: string;
  imageObjectPosition?: string;
  onImageSrcChange?: (src: string) => void;
  onImageAltChange?: (alt: string) => void;
  onImageStyleChange?: (property: string, value: string) => void;
}

type BackgroundType = "solid" | "linear" | "radial" | "conic";

interface GradientStop {
  color: string;
  opacity: number;
}

interface GradientConfig {
  type: BackgroundType;
  direction: string;
  from: GradientStop;
  via: GradientStop | null;
  to: GradientStop;
}

const presetColors = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Zinc 900", value: "#18181b" },
  { name: "Zinc 800", value: "#27272a" },
  { name: "Zinc 700", value: "#3f3f46" },
  { name: "Zinc 600", value: "#52525b" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Transparent", value: "transparent" },
];

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
  { value: "to right", label: "To Right", angle: "90deg" },
  { value: "to left", label: "To Left", angle: "270deg" },
  { value: "to bottom", label: "To Bottom", angle: "180deg" },
  { value: "to top", label: "To Top", angle: "0deg" },
  { value: "to bottom right", label: "To Bottom Right", angle: "135deg" },
  { value: "to bottom left", label: "To Bottom Left", angle: "225deg" },
  { value: "to top right", label: "To Top Right", angle: "45deg" },
  { value: "to top left", label: "To Top Left", angle: "315deg" },
];

const backgroundSizes = ["auto", "cover", "contain", "100%", "50%"];
const backgroundPositions = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

// Helper to parse color with opacity
function parseColorWithOpacity(colorStr: string): { color: string; opacity: number } {
  // Handle rgba format
  const rgbaMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { color: hex, opacity: Math.round(a * 100) };
  }

  // Handle hex with alpha
  if (colorStr.startsWith("#") && colorStr.length === 9) {
    const alpha = parseInt(colorStr.slice(7, 9), 16) / 255;
    return { color: colorStr.slice(0, 7), opacity: Math.round(alpha * 100) };
  }

  // Handle color/opacity format like "white/30"
  const slashMatch = colorStr.match(/^([^/]+)\/(\d+)$/);
  if (slashMatch) {
    return { color: slashMatch[1], opacity: parseInt(slashMatch[2]) };
  }

  return { color: colorStr || "#ffffff", opacity: 100 };
}

// Helper to create color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  if (opacity >= 100) return color;

  // Convert to rgba
  const hex = colorToHex(color, "#ffffff");
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Parse existing background to detect gradient
function parseBackground(bg: string): { type: BackgroundType; config: GradientConfig | null } {
  if (!bg) return { type: "solid", config: null };

  // Linear gradient
  if (bg.includes("linear-gradient")) {
    const match = bg.match(/linear-gradient\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*(?:,\s*([^,]+))?\s*(?:,\s*([^)]+))?\s*\)/i);
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
      };
    }
  }

  // Radial gradient
  if (bg.includes("radial-gradient")) {
    const match = bg.match(/radial-gradient\s*\(\s*(?:circle\s*(?:at\s*[^,]+)?\s*,\s*)?([^,]+)\s*(?:,\s*([^,]+))?\s*(?:,\s*([^)]+))?\s*\)/i);
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
      };
    }
  }

  // Conic gradient
  if (bg.includes("conic-gradient")) {
    const match = bg.match(/conic-gradient\s*\(\s*(?:from\s+([^,]+)\s*,\s*)?([^,]+)\s*(?:,\s*([^,]+))?\s*(?:,\s*([^)]+))?\s*\)/i);
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
      };
    }
  }

  return { type: "solid", config: null };
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

export function BackgroundSection({
  backgroundColor,
  backgroundImage,
  backgroundSize,
  backgroundPosition,
  onBackgroundChange,
  hasActiveProperties,
  // IMG element props
  isImageElement,
  imageSrc,
  imageAlt,
  imageObjectFit,
  imageObjectPosition,
  onImageSrcChange,
  onImageAltChange,
  onImageStyleChange,
}: BackgroundSectionProps) {
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [gradientPage, setGradientPage] = useState(0);

  // Image overlay state - parse from existing background if it has overlay
  const parseImageOverlay = useCallback((bgImage: string): { enabled: boolean; color: string; opacity: number } => {
    if (!bgImage) return { enabled: false, color: "#000000", opacity: 50 };
    // Check if background has a linear-gradient overlay: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(...)
    const overlayMatch = bgImage.match(/linear-gradient\s*\(\s*rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
    if (overlayMatch) {
      const r = parseInt(overlayMatch[1]);
      const g = parseInt(overlayMatch[2]);
      const b = parseInt(overlayMatch[3]);
      const a = parseFloat(overlayMatch[4]);
      const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      return { enabled: true, color: hex, opacity: Math.round(a * 100) };
    }
    return { enabled: false, color: "#000000", opacity: 50 };
  }, []);

  const [imageOverlay, setImageOverlay] = useState(() => parseImageOverlay(backgroundImage));
  const isInternalUpdateRef = useRef(false);

  // Sync overlay state when backgroundImage changes externally (not from our own update)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    const parsed = parseImageOverlay(backgroundImage);
    setImageOverlay(parsed);
  }, [backgroundImage, parseImageOverlay]);

  // Background assets from store
  const { addBackgroundAsset, backgroundAssets, removeBackgroundAsset } = useEditorStore();

  // Handle applying a background asset
  const handleApplyAsset = useCallback(
    (asset: BackgroundAsset) => {
      addBackgroundAsset(asset);
    },
    [addBackgroundAsset]
  );

  // Parse current background
  const { type: detectedType, config: detectedConfig } = useMemo(() => parseBackground(backgroundColor), [backgroundColor]);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(detectedType);

  // Gradient state
  const [gradientConfig, setGradientConfig] = useState<GradientConfig>(
    detectedConfig || {
      type: "linear",
      direction: "to right",
      from: { color: "#ffffff", opacity: 30 },
      via: null,
      to: { color: "#ffffff", opacity: 0 },
    }
  );

  // Convert backgroundColor to HEX for the color input
  const hexBackgroundColor = useMemo(() => {
    return colorToHex(backgroundColor);
  }, [backgroundColor]);

  // Extract clean URL from background-image (remove ALL overlay gradients if present)
  const extractImageUrl = useCallback((bgImage: string): string => {
    if (!bgImage) return "";
    // Keep removing overlay gradient patterns until we get to the url()
    let cleaned = bgImage;
    // Remove ALL linear-gradient(rgba...) patterns - they may have accumulated
    while (cleaned.match(/^linear-gradient\s*\(\s*rgba\s*\([^)]+\)\s*,\s*rgba\s*\([^)]+\)\s*\)\s*,\s*/i)) {
      cleaned = cleaned.replace(/^linear-gradient\s*\(\s*rgba\s*\([^)]+\)\s*,\s*rgba\s*\([^)]+\)\s*\)\s*,\s*/i, "").trim();
    }
    // Also handle case where there's no comma after gradient (malformed)
    cleaned = cleaned.replace(/^linear-gradient\s*\([^)]+\)\s*,?\s*/gi, "").trim();
    // Extract just the url(...) part if it exists
    const urlMatch = cleaned.match(/url\s*\(\s*['"]?[^'")\s]+['"]?\s*\)/i);
    return urlMatch ? urlMatch[0] : cleaned;
  }, []);

  // Apply overlay to background image
  const applyImageOverlay = useCallback((imageUrl: string, overlay: { enabled: boolean; color: string; opacity: number }) => {
    // Extract just the URL from background-image value
    const cleanUrl = extractImageUrl(imageUrl);

    if (!overlay.enabled || !cleanUrl) {
      return cleanUrl;
    }

    // Convert hex to rgba
    const hex = overlay.color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    const a = overlay.opacity / 100;

    // Create overlay gradient + image
    return `linear-gradient(rgba(${r}, ${g}, ${b}, ${a}), rgba(${r}, ${g}, ${b}, ${a})), ${cleanUrl}`;
  }, [extractImageUrl]);

  const handleImageSelect = (url: string) => {
    // For IMG elements, update the src attribute
    if (isImageElement && onImageSrcChange) {
      onImageSrcChange(url);
      setIsImageSelectorOpen(false);
      return;
    }
    // For background images
    const bgValue = applyImageOverlay(`url('${url}')`, imageOverlay);
    isInternalUpdateRef.current = true;
    onBackgroundChange("backgroundImage", bgValue);
    setIsImageSelectorOpen(false);
  };

  const handleOverlayChange = useCallback((updates: Partial<{ enabled: boolean; color: string; opacity: number }>) => {
    setImageOverlay(prev => {
      const newOverlay = { ...prev, ...updates };

      // Re-apply background with new overlay
      if (backgroundImage) {
        const cleanUrl = extractImageUrl(backgroundImage);
        if (cleanUrl) {
          const bgValue = applyImageOverlay(cleanUrl, newOverlay);
          // Mark as internal update to prevent useEffect from resetting state
          isInternalUpdateRef.current = true;
          onBackgroundChange("backgroundImage", bgValue);
        }
      }

      return newOverlay;
    });
  }, [backgroundImage, extractImageUrl, applyImageOverlay, onBackgroundChange]);

  const handleTypeChange = (type: BackgroundType) => {
    setBackgroundType(type);
    if (type === "solid") {
      onBackgroundChange("backgroundColor", gradientConfig.from.color);
    } else {
      const newConfig = { ...gradientConfig, type };
      setGradientConfig(newConfig);
      onBackgroundChange("backgroundColor", buildGradient(newConfig));
    }
  };

  const updateGradient = useCallback((updates: Partial<GradientConfig>) => {
    const newConfig = { ...gradientConfig, ...updates };
    setGradientConfig(newConfig);
    onBackgroundChange("backgroundColor", buildGradient(newConfig));
  }, [gradientConfig, onBackgroundChange]);

  const updateGradientStop = useCallback((stop: "from" | "via" | "to", updates: Partial<GradientStop>) => {
    const currentStop = stop === "via" ? gradientConfig.via || { color: "#ffffff", opacity: 100 } : gradientConfig[stop];
    const newStop = { ...currentStop, ...updates };

    if (stop === "via") {
      updateGradient({ via: newStop });
    } else {
      updateGradient({ [stop]: newStop });
    }
  }, [gradientConfig, updateGradient]);

  const toggleVia = useCallback(() => {
    if (gradientConfig.via) {
      updateGradient({ via: null });
    } else {
      updateGradient({ via: { color: "#ffffff", opacity: 100 } });
    }
  }, [gradientConfig, updateGradient]);

  const applyPresetGradient = (preset: { from: string; via?: string; to: string }) => {
    const newConfig: GradientConfig = {
      ...gradientConfig,
      from: { color: preset.from, opacity: 100 },
      via: preset.via ? { color: preset.via, opacity: 100 } : null,
      to: { color: preset.to, opacity: 100 },
    };
    setGradientConfig(newConfig);
    onBackgroundChange("backgroundColor", buildGradient(newConfig));
  };

  const currentPresets = backgroundType !== "solid"
    ? presetGradients[backgroundType as keyof typeof presetGradients] || presetGradients.linear
    : [];

  const presetsPerPage = 12;
  const totalPages = Math.ceil(currentPresets.length / presetsPerPage);
  const displayedPresets = currentPresets.slice(gradientPage * presetsPerPage, (gradientPage + 1) * presetsPerPage);

  return (
    <CollapsibleSection title="Background" icon={<Paintbrush className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-3">
        {/* Background Type Tabs */}
        <div className="flex rounded-md border bg-muted/30 p-0.5">
          {(["solid", "linear", "radial", "conic"] as BackgroundType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={cn(
                "flex-1 rounded-sm px-1.5 py-1 text-[10px] font-medium transition-colors capitalize",
                backgroundType === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Solid Color */}
        {backgroundType === "solid" && (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="color"
                value={hexBackgroundColor}
                onChange={(e) => onBackgroundChange("backgroundColor", e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border bg-transparent flex-shrink-0"
              />
              <input
                type="text"
                value={backgroundColor || ""}
                onChange={(e) => onBackgroundChange("backgroundColor", e.target.value)}
                placeholder="transparent"
                className="h-6 flex-1 rounded border bg-transparent px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Preset Colors */}
            <div className="flex flex-wrap gap-1">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onBackgroundChange("backgroundColor", color.value)}
                  className={cn(
                    "h-5 w-5 rounded border transition-transform hover:scale-110",
                    backgroundColor === color.value && "ring-1 ring-[hsl(var(--buildix-primary))] ring-offset-1"
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
        )}

        {/* Gradient Options */}
        {backgroundType !== "solid" && (
          <div className="space-y-3">
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
                  const gradient = backgroundType === "linear"
                    ? `linear-gradient(to right, ${preset.from}, ${"via" in preset ? preset.via + ", " : ""}${preset.to})`
                    : backgroundType === "radial"
                    ? `radial-gradient(circle, ${preset.from}, ${preset.to})`
                    : `conic-gradient(${preset.from}, ${"via" in preset ? preset.via + ", " : ""}${preset.to})`;

                  return (
                    <button
                      key={idx}
                      onClick={() => applyPresetGradient(preset as { from: string; via?: string; to: string })}
                      className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                      style={{ background: gradient }}
                      title={preset.name}
                    />
                  );
                })}
              </div>
            </div>

            {/* Direction (for linear gradients) */}
            {backgroundType === "linear" && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground">Direction</label>
                <div className="flex items-center gap-2">
                  {/* Visual direction picker - compact */}
                  <div className="relative h-12 w-12 rounded-full border border-muted flex-shrink-0">
                    {gradientDirections.map((dir) => {
                      const angle = parseInt(dir.angle);
                      const rad = (angle - 90) * (Math.PI / 180);
                      const x = 50 + 38 * Math.cos(rad);
                      const y = 50 + 38 * Math.sin(rad);
                      const isActive = gradientConfig.direction === dir.value;

                      return (
                        <button
                          key={dir.value}
                          onClick={() => updateGradient({ direction: dir.value })}
                          className={cn(
                            "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors",
                            isActive ? "bg-[hsl(var(--buildix-primary))]" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                          )}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          title={dir.label}
                        />
                      );
                    })}
                    <div
                      className="absolute inset-1.5 rounded-full"
                      style={{ background: buildGradient(gradientConfig) }}
                    />
                  </div>
                  <select
                    value={gradientConfig.direction}
                    onChange={(e) => updateGradient({ direction: e.target.value })}
                    className="h-6 flex-1 rounded border bg-background px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {gradientDirections.map((dir) => (
                      <option key={dir.value} value={dir.value}>
                        {dir.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-muted-foreground w-8 text-right flex-shrink-0">
                    {gradientDirections.find(d => d.value === gradientConfig.direction)?.angle || ""}
                  </span>
                </div>
              </div>
            )}

            {/* Conic angle */}
            {backgroundType === "conic" && (
              <div className="space-y-1">
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
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              {/* From */}
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

              {/* To */}
              <ColorStopInput
                label="To"
                color={gradientConfig.to.color}
                opacity={gradientConfig.to.opacity}
                onColorChange={(c) => updateGradientStop("to", { color: c })}
                onOpacityChange={(o) => updateGradientStop("to", { opacity: o })}
              />
            </div>

            {/* Preview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Preview</span>
                <button
                  onClick={() => {
                    setGradientConfig({
                      type: backgroundType,
                      direction: "to right",
                      from: { color: "#ffffff", opacity: 30 },
                      via: null,
                      to: { color: "#ffffff", opacity: 0 },
                    });
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Reset
                </button>
              </div>
              <div
                className="h-8 w-full rounded border"
                style={{ background: buildGradient(gradientConfig) }}
              />
            </div>
          </div>
        )}

        {/* Image Section - For IMG elements or Background Image */}
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground">
              {isImageElement ? "Image Source" : "Image"}
            </label>
            {(isImageElement ? imageSrc : backgroundImage) && !isImageElement && (
              <button
                onClick={() => onBackgroundChange("backgroundImage", "")}
                className="text-[10px] text-muted-foreground hover:text-destructive"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          {/* IMG Element Preview */}
          {isImageElement && imageSrc ? (
            <div className="space-y-2">
              {/* Image Preview with checkerboard for transparency */}
              <div
                className="relative h-20 w-full overflow-hidden rounded border cursor-pointer group"
                onClick={() => setIsImageSelectorOpen(true)}
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #404040 25%, transparent 25%),
                    linear-gradient(-45deg, #404040 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #404040 75%),
                    linear-gradient(-45deg, transparent 75%, #404040 75%)
                  `,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  backgroundColor: '#2a2a2a'
                }}
              >
                <img
                  src={imageSrc}
                  alt={imageAlt || "Preview"}
                  className="h-full w-full object-contain transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium">Change Image</span>
                </div>
              </div>

              {/* Source URL Input */}
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground">URL</label>
                <input
                  type="text"
                  value={imageSrc}
                  onChange={(e) => onImageSrcChange?.(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="h-6 w-full rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Alt Text Input */}
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground">Alt Text</label>
                <input
                  type="text"
                  value={imageAlt || ""}
                  onChange={(e) => onImageAltChange?.(e.target.value)}
                  placeholder="Image description"
                  className="h-6 w-full rounded border bg-background px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Object Fit & Position Controls */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/30">
                {/* Object Fit */}
                <div className="space-y-0.5">
                  <label className="text-[9px] text-muted-foreground">Fit</label>
                  <select
                    value={imageObjectFit || "cover"}
                    onChange={(e) => onImageStyleChange?.("objectFit", e.target.value)}
                    className="h-6 w-full rounded border bg-background text-foreground px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                    <option value="none">None</option>
                    <option value="scale-down">Scale Down</option>
                  </select>
                </div>

                {/* Object Position */}
                <div className="space-y-0.5">
                  <label className="text-[9px] text-muted-foreground">Position</label>
                  <select
                    value={imageObjectPosition || "center"}
                    onChange={(e) => onImageStyleChange?.("objectPosition", e.target.value)}
                    className="h-6 w-full rounded border bg-background text-foreground px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top left">Top Left</option>
                    <option value="top right">Top Right</option>
                    <option value="bottom left">Bottom Left</option>
                    <option value="bottom right">Bottom Right</option>
                  </select>
                </div>
              </div>
            </div>
          ) : isImageElement && !imageSrc ? (
            <button
              onClick={() => setIsImageSelectorOpen(true)}
              className="flex h-10 w-full items-center justify-center rounded border border-dashed hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                <span className="text-[10px]">Select Image</span>
              </div>
            </button>
          ) : backgroundImage ? (
            <div
              className="relative h-12 w-full overflow-hidden rounded border cursor-pointer group"
              onClick={() => setIsImageSelectorOpen(true)}
            >
              <img
                src={extractImageUrl(backgroundImage).replace(/url\(['"]?|['"]?\)/g, "")}
                alt="Background"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">Change</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsImageSelectorOpen(true)}
              className="flex h-10 w-full items-center justify-center rounded border border-dashed hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                <span className="text-[10px]">Add Image</span>
              </div>
            </button>
          )}

          {/* Image Selector Modal */}
          <ImageSelectorModal
            open={isImageSelectorOpen}
            onOpenChange={setIsImageSelectorOpen}
            onSelectImage={handleImageSelect}
          />

          {/* Asset Background Modal */}
          <AssetBackgroundModal
            open={isAssetModalOpen}
            onOpenChange={setIsAssetModalOpen}
            onApplyAsset={handleApplyAsset}
          />

          {backgroundImage && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {/* Background Size */}
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">Size</label>
                  <select
                    value={backgroundSize || "cover"}
                    onChange={(e) => onBackgroundChange("backgroundSize", e.target.value)}
                    className="h-6 w-full rounded border bg-background text-foreground px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
                  >
                    {backgroundSizes.map((size) => (
                      <option key={size} value={size} className="bg-background text-foreground">
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Background Position */}
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">Position</label>
                  <select
                    value={backgroundPosition || "center"}
                    onChange={(e) => onBackgroundChange("backgroundPosition", e.target.value)}
                    className="h-6 w-full rounded border bg-background text-foreground px-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-background [&>option]:text-foreground"
                  >
                    {backgroundPositions.map((pos) => (
                      <option key={pos} value={pos} className="bg-background text-foreground">
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Overlay Controls */}
              <div className="space-y-2 pt-2 border-t border-border/30 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground">Color Overlay</label>
                  <button
                    onClick={() => handleOverlayChange({ enabled: !imageOverlay.enabled })}
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative flex-shrink-0",
                      imageOverlay.enabled ? "bg-[hsl(var(--buildix-primary))]" : "bg-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200",
                        imageOverlay.enabled && "translate-x-4"
                      )}
                    />
                  </button>
                </div>

                {imageOverlay.enabled && (
                  <div className="space-y-2">
                    {/* Overlay Color */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={imageOverlay.color}
                        onChange={(e) => handleOverlayChange({ color: e.target.value })}
                        className="h-6 w-6 cursor-pointer rounded border bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={imageOverlay.color}
                        onChange={(e) => handleOverlayChange({ color: e.target.value })}
                        className="h-6 flex-1 rounded border bg-background px-1.5 text-[10px] font-mono"
                      />
                    </div>

                    {/* Overlay Opacity */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground w-12">Opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={imageOverlay.opacity}
                        onChange={(e) => handleOverlayChange({ opacity: parseInt(e.target.value) })}
                        className="flex-1 h-1"
                      />
                      <span className="text-[10px] text-muted-foreground w-8 text-right">
                        {imageOverlay.opacity}%
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOverlayChange({ color: "#000000", opacity: 50, enabled: true })}
                        className="flex-1 h-6 rounded border text-[9px] hover:bg-muted/50 transition-colors"
                        title="Dark"
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => handleOverlayChange({ color: "#000000", opacity: 30, enabled: true })}
                        className="flex-1 h-6 rounded border text-[9px] hover:bg-muted/50 transition-colors"
                        title="Light Dark"
                      >
                        Light
                      </button>
                      <button
                        onClick={() => handleOverlayChange({ color: "#000000", opacity: 70, enabled: true })}
                        className="flex-1 h-6 rounded border text-[9px] hover:bg-muted/50 transition-colors"
                        title="Heavy"
                      >
                        Heavy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Asset Background Section */}
        <div className="pt-2 border-t border-border/50">
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded border border-dashed hover:bg-muted/50 transition-colors hover:border-[hsl(var(--buildix-primary))]/50"
          >
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--buildix-primary))]" />
            <span className="text-[10px] font-medium">Add Asset Background</span>
          </button>
          <p className="text-[9px] text-muted-foreground text-center mt-1.5">
            Video, Embed (Unicorn Studio, Spline), or Image with effects
          </p>

          {/* Active Background Assets */}
          {backgroundAssets && backgroundAssets.length > 0 && (
            <div className="mt-3 space-y-2">
              <label className="text-[10px] text-muted-foreground">Active Assets</label>
              {backgroundAssets.map((asset) => (
                <div key={asset.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                  {asset.type === "image" && (
                    <div
                      className="h-10 w-10 rounded flex-shrink-0"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #404040 25%, transparent 25%),
                          linear-gradient(-45deg, #404040 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #404040 75%),
                          linear-gradient(-45deg, transparent 75%, #404040 75%)
                        `,
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                        backgroundColor: '#303030'
                      }}
                    >
                      <img src={asset.src} className="h-full w-full object-cover rounded" alt="" />
                    </div>
                  )}
                  {asset.type === "video" && (
                    <video src={asset.src} className="h-10 w-10 object-cover rounded flex-shrink-0" muted />
                  )}
                  {asset.type === "embed" && (
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium capitalize">{asset.type}</span>
                    {asset.embedType && (
                      <span className="text-[9px] text-muted-foreground ml-1">({asset.embedType})</span>
                    )}
                    <p className="text-[9px] text-muted-foreground truncate">
                      {asset.src ? asset.src.substring(0, 25) + "..." : "Embed code"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeBackgroundAsset(asset.id)}
                    className="p-1 hover:bg-destructive/20 rounded flex-shrink-0"
                    title="Remove asset"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// Color Stop Input Component - Compact version
interface ColorStopInputProps {
  label: string;
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
}

function ColorStopInput({ label, color, opacity, onColorChange, onOpacityChange }: ColorStopInputProps) {
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
