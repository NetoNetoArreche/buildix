"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Sun,
  Moon,
  ImageIcon,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Box,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  LayoutGrid,
  Sparkles,
  Palette,
  Layers,
  Move,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  useCanvasModeStore,
  type AestheticPreset,
  type LayoutPreset,
  type ShadowType,
  type BrightnessType,
  type BackgroundType,
  layoutPresetConfigs,
} from "@/stores/canvasModeStore";
import { cn } from "@/lib/utils";
import { AssetBackgroundModal } from "@/components/editor/modals/AssetBackgroundModal";
import type { BackgroundAsset } from "@/types";
import { X } from "lucide-react";

// Aesthetic preset buttons config
const aestheticButtons: { id: AestheticPreset; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
  { id: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
  { id: "image-light", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { id: "image-dark", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
];

// Layout preset buttons config - now shows frame count
const layoutButtons: { id: LayoutPreset; label: string; icon: React.ReactNode; frameCount: number }[] = [
  { id: "desktop", label: "Desktop", icon: <Monitor className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "desktop-2", label: "Desktop 2", icon: <Monitor className="h-3.5 w-3.5" />, frameCount: 2 },
  { id: "desktop-3", label: "Desktop 3", icon: <Monitor className="h-3.5 w-3.5" />, frameCount: 3 },
  { id: "desktop-4", label: "Desktop 4", icon: <Monitor className="h-3.5 w-3.5" />, frameCount: 4 },
  { id: "desktop-5", label: "Desktop 5", icon: <Monitor className="h-3.5 w-3.5" />, frameCount: 5 },
  { id: "devices", label: "Devices", icon: <Smartphone className="h-3.5 w-3.5" />, frameCount: 2 },
  { id: "3d", label: "3D", icon: <Box className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "mockup", label: "Mockup", icon: <Square className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "iphone", label: "iPhone", icon: <Smartphone className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "laptop", label: "Laptop", icon: <Laptop className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "ipad", label: "iPad", icon: <Tablet className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "android", label: "Android", icon: <Smartphone className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "card", label: "Card", icon: <Square className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "landscape", label: "Landscape", icon: <RectangleHorizontal className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "portrait", label: "Portrait", icon: <RectangleVertical className="h-3.5 w-3.5" />, frameCount: 1 },
  { id: "angle", label: "Angle", icon: <Box className="h-3.5 w-3.5" />, frameCount: 1 },
];

// Preset color options
const colorPresets = [
  { label: "Transparent", value: "transparent" },
  { label: "White", value: "#ffffff" },
  { label: "Light Gray", value: "#f5f5f5" },
  { label: "Gray", value: "#a3a3a3" },
  { label: "Dark Gray", value: "#404040" },
  { label: "Neutral 800", value: "#262626" },
  { label: "Black", value: "#000000" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
];

export function CanvasModeSection() {
  const {
    isFullscreen,
    activeAesthetic,
    activeLayout,
    frames,
    backgroundColor,
    borderColor,
    cornerRadius,
    ringWidth,
    shadow,
    brightness,
    zoom,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    panX,
    panY,
    backgroundType,
    backgroundValue,
    overlayImage,
    toggleFullscreen,
    setAestheticPreset,
    setLayoutPreset,
    setBackgroundColor,
    setBorderColor,
    setCornerRadius,
    setRingWidth,
    setShadow,
    setBrightness,
    setZoom,
    setRotateX,
    setRotateY,
    setRotateZ,
    setPerspective,
    resetTransforms,
    resetPan,
    setBackgroundType,
    setBackgroundAsset,
    setOverlayAsset,
  } = useCanvasModeStore();

  // Find display color names
  const bgColorName = useMemo(() => {
    const preset = colorPresets.find((p) => p.value === backgroundColor);
    return preset?.label || backgroundColor;
  }, [backgroundColor]);

  const borderColorName = useMemo(() => {
    const preset = colorPresets.find((p) => p.value === borderColor);
    return preset?.label || borderColor;
  }, [borderColor]);

  // Get current layout info
  const currentLayoutConfig = layoutPresetConfigs[activeLayout];
  const currentFrameInfo = useMemo(() => {
    if (!currentLayoutConfig) return "";
    const frameCount = currentLayoutConfig.frames.length;
    const devices = currentLayoutConfig.frames.map(f => f.device).join(" + ");
    return `${frameCount} frame${frameCount > 1 ? "s" : ""} (${devices})`;
  }, [currentLayoutConfig]);

  // Image picker modal state
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);

  // Handler for when background image is selected - passes full asset with effects
  const handleBackgroundImageSelect = useCallback((asset: BackgroundAsset) => {
    setBackgroundAsset(asset);
    setShowBackgroundPicker(false);
  }, [setBackgroundAsset]);

  // Handler for when overlay image is selected - passes full asset with effects
  const handleOverlayImageSelect = useCallback((asset: BackgroundAsset) => {
    setOverlayAsset(asset);
    setShowOverlayPicker(false);
  }, [setOverlayAsset]);

  return (
    <div className="space-y-0 px-3 pb-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between py-2 border-b border-border/50 -mx-3 px-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Canvas Mode</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Presets Section */}
      <CollapsibleSection title="Presets" icon={<LayoutGrid className="h-4 w-4" />}>
        {/* Aesthetic Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Aesthetic
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {aestheticButtons.map((preset) => (
              <Button
                key={preset.id}
                variant={activeAesthetic === preset.id ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-auto flex-col gap-1 py-2 text-[10px]",
                  activeAesthetic === preset.id && "border-primary"
                )}
                onClick={() => setAestheticPreset(preset.id)}
              >
                {preset.icon}
                <span className="truncate">{preset.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Layout Presets */}
        <div className="space-y-1.5 mt-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Layout
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {layoutButtons.map((preset) => (
              <Button
                key={preset.id}
                variant={activeLayout === preset.id ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-auto flex-col gap-1 py-2 text-[10px] relative",
                  activeLayout === preset.id && "border-primary"
                )}
                onClick={() => setLayoutPreset(preset.id)}
              >
                {preset.icon}
                <span className="truncate">{preset.label}</span>
                {preset.frameCount > 1 && (
                  <span className="absolute top-1 right-1 text-[8px] bg-violet-500/20 text-violet-400 px-1 rounded">
                    {preset.frameCount}
                  </span>
                )}
              </Button>
            ))}
          </div>
          {/* Current Layout Info */}
          <p className="text-[10px] text-muted-foreground/70 mt-2">
            Current: {currentFrameInfo}
          </p>
        </div>
      </CollapsibleSection>

      {/* Appearance Section */}
      <CollapsibleSection title="Appearance" icon={<Palette className="h-4 w-4" />}>
        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          {/* Background Color */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Background</span>
            <Select value={backgroundColor} onValueChange={setBackgroundColor}>
              <SelectTrigger className="h-8 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: backgroundColor === "transparent" ? "transparent" : backgroundColor }}
                  />
                  <span className="truncate">{bgColorName}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: color.value === "transparent" ? "transparent" : color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Border Color */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Border</span>
            <Select value={borderColor} onValueChange={setBorderColor}>
              <SelectTrigger className="h-8 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: borderColor === "transparent" ? "transparent" : borderColor }}
                  />
                  <span className="truncate">{borderColorName}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: color.value === "transparent" ? "transparent" : color.value }}
                      />
                      <span>{color.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Corner & Ring */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Corner</span>
              <span className="text-xs text-muted-foreground">{cornerRadius}px</span>
            </div>
            <Slider
              value={[cornerRadius]}
              onValueChange={([value]) => setCornerRadius(value)}
              min={0}
              max={80}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ring</span>
              <span className="text-xs text-muted-foreground">{ringWidth}px</span>
            </div>
            <Slider
              value={[ringWidth]}
              onValueChange={([value]) => setRingWidth(value)}
              min={0}
              max={16}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Shadow & Brightness */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Shadow</span>
            <Select value={shadow} onValueChange={(v) => setShadow(v as ShadowType)}>
              <SelectTrigger className="h-8 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="angle-xl">Angle XL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Brightness</span>
            <Select value={brightness} onValueChange={(v) => setBrightness(v as BrightnessType)}>
              <SelectTrigger className="h-8 text-xs">
                <div className="flex items-center gap-2">
                  <Sun className="h-3 w-3" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="dim">Dim</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bright">Bright</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Zoom */}
        <div className="space-y-1.5 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <span className="text-xs text-muted-foreground">{zoom}%</span>
          </div>
          <Slider
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
            min={10}
            max={150}
            step={5}
            className="w-full"
          />
        </div>

        {/* Pan Position */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Move className="h-3.5 w-3.5" />
            <span>Position: {Math.round(panX)}, {Math.round(panY)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={resetPan}
          >
            Reset
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          Hold Space + Drag to pan the canvas
        </p>
      </CollapsibleSection>

      {/* 3D Transforms Section */}
      <CollapsibleSection title="3D Transforms" icon={<Box className="h-4 w-4" />} defaultOpen={false}>
        <div className="flex items-center justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={resetTransforms}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rotate X</span>
              <span className="text-xs text-muted-foreground">{rotateX}°</span>
            </div>
            <Slider
              value={[rotateX]}
              onValueChange={([value]) => setRotateX(value)}
              min={-45}
              max={45}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rotate Y</span>
              <span className="text-xs text-muted-foreground">{rotateY}°</span>
            </div>
            <Slider
              value={[rotateY]}
              onValueChange={([value]) => setRotateY(value)}
              min={-45}
              max={45}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rotate Z</span>
              <span className="text-xs text-muted-foreground">{rotateZ}°</span>
            </div>
            <Slider
              value={[rotateZ]}
              onValueChange={([value]) => setRotateZ(value)}
              min={-45}
              max={45}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Perspective</span>
              <span className="text-xs text-muted-foreground">{perspective}px</span>
            </div>
            <Slider
              value={[perspective]}
              onValueChange={([value]) => setPerspective(value)}
              min={0}
              max={2000}
              step={50}
              className="w-full"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Canvas Background Section */}
      <CollapsibleSection title="Canvas Background" icon={<ImageIcon className="h-4 w-4" />} defaultOpen={false}>
        <Tabs
          value={backgroundType}
          onValueChange={(v) => setBackgroundType(v as BackgroundType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="embed" className="text-xs">Embed</TabsTrigger>
            <TabsTrigger value="video" className="text-xs">Video</TabsTrigger>
            <TabsTrigger value="image" className="text-xs">Image</TabsTrigger>
          </TabsList>
        </Tabs>

        {backgroundType === "embed" && (
          <div className="flex items-center gap-2 rounded-md border p-2 mt-3">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Using Background Color</span>
          </div>
        )}

        {backgroundType === "video" && (
          <input
            type="text"
            placeholder="Video URL..."
            value={backgroundValue}
            onChange={(e) => setBackgroundValue(e.target.value)}
            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring mt-3"
          />
        )}

        {backgroundType === "image" && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center gap-2 rounded-md border p-2 overflow-hidden">
              {backgroundValue ? (
                <img
                  src={backgroundValue}
                  alt="Background preview"
                  className="h-6 w-6 rounded object-cover flex-shrink-0"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                {backgroundValue ? "Image selected" : "No Image"}
              </span>
              {backgroundValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setBackgroundAsset(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs flex-shrink-0"
                onClick={() => setShowBackgroundPicker(true)}
              >
                Select
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              Set an image as canvas background. Supports JPG, PNG, WebP, SVG.
            </p>
          </div>
        )}
      </CollapsibleSection>

      {/* Canvas Overlay Section */}
      <CollapsibleSection title="Canvas Overlay" icon={<Layers className="h-4 w-4" />} defaultOpen={false}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border p-2 overflow-hidden">
            {overlayImage ? (
              <img
                src={overlayImage}
                alt="Overlay preview"
                className="h-6 w-6 rounded object-cover flex-shrink-0"
              />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
              {overlayImage ? "Image selected" : "No Image"}
            </span>
            {overlayImage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setOverlayAsset(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs flex-shrink-0"
              onClick={() => setShowOverlayPicker(true)}
            >
              Select
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            Set an image as canvas overlay (pointer-events-none).
          </p>
        </div>
      </CollapsibleSection>

      {/* Background Image Picker Modal */}
      <AssetBackgroundModal
        open={showBackgroundPicker}
        onOpenChange={setShowBackgroundPicker}
        onApplyAsset={handleBackgroundImageSelect}
      />

      {/* Overlay Image Picker Modal */}
      <AssetBackgroundModal
        open={showOverlayPicker}
        onOpenChange={setShowOverlayPicker}
        onApplyAsset={handleOverlayImageSelect}
      />
    </div>
  );
}
