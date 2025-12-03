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
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  X,
  LayoutGrid,
  Sparkles,
  Palette,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCanvasModeStore,
  type AestheticPreset,
  type LayoutPreset,
  type ShadowType,
  type BrightnessType,
  type BackgroundType,
} from "@/stores/canvasModeStore";
import { cn } from "@/lib/utils";
import { AssetBackgroundModal } from "@/components/editor/modals/AssetBackgroundModal";
import type { BackgroundAsset } from "@/types";

// Aesthetic preset buttons config
const aestheticButtons: { id: AestheticPreset; label: string; icon: React.ReactNode }[] = [
  { id: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
  { id: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
  { id: "image-light", label: "Image Light", icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { id: "image-dark", label: "Image Dark", icon: <ImageIcon className="h-3.5 w-3.5" /> },
];

// Layout preset buttons config
const layoutButtons: { id: LayoutPreset; label: string; icon: React.ReactNode }[] = [
  { id: "desktop", label: "Desktop", icon: <Monitor className="h-3.5 w-3.5" /> },
  { id: "desktop-2", label: "Desktop 2", icon: <Monitor className="h-3.5 w-3.5" /> },
  { id: "desktop-3", label: "Desktop 3", icon: <Monitor className="h-3.5 w-3.5" /> },
  { id: "desktop-4", label: "Desktop 4", icon: <Monitor className="h-3.5 w-3.5" /> },
  { id: "desktop-5", label: "Desktop 5", icon: <Monitor className="h-3.5 w-3.5" /> },
  { id: "devices", label: "Devices", icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: "3d", label: "3D", icon: <Box className="h-3.5 w-3.5" /> },
  { id: "mockup", label: "Mockup", icon: <Square className="h-3.5 w-3.5" /> },
  { id: "iphone", label: "iPhone", icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: "laptop", label: "Laptop", icon: <Laptop className="h-3.5 w-3.5" /> },
  { id: "ipad", label: "iPad", icon: <Tablet className="h-3.5 w-3.5" /> },
  { id: "android", label: "Android", icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: "card", label: "Card", icon: <Square className="h-3.5 w-3.5" /> },
  { id: "landscape", label: "Landscape", icon: <RectangleHorizontal className="h-3.5 w-3.5" /> },
  { id: "portrait", label: "Portrait", icon: <RectangleVertical className="h-3.5 w-3.5" /> },
  { id: "angle", label: "Angle", icon: <Box className="h-3.5 w-3.5" /> },
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

export function CanvasModePanel() {
  const {
    isOpen,
    isFullscreen,
    activeAesthetic,
    activeLayout,
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
    backgroundType,
    backgroundValue,
    overlayImage,
    toggleOpen,
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
    setBackgroundType,
    setBackgroundValue,
    setOverlayImage,
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

  // Image picker modal state
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);

  // Handler for when background image is selected
  const handleBackgroundImageSelect = useCallback((asset: BackgroundAsset) => {
    setBackgroundValue(asset.src);
    setShowBackgroundPicker(false);
  }, [setBackgroundValue]);

  // Handler for when overlay image is selected
  const handleOverlayImageSelect = useCallback((asset: BackgroundAsset) => {
    setOverlayImage(asset.src);
    setShowOverlayPicker(false);
  }, [setOverlayImage]);

  if (!isOpen) return null;

  return (
    <div className="absolute left-2 top-12 z-50 w-[280px] rounded-lg border bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Canvas</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setZoom(Math.max(10, zoom - 10))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-10 text-center text-xs text-muted-foreground">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setZoom(Math.min(150, zoom + 10))}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggleOpen}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)] max-h-[600px]">
        <div className="space-y-4 p-3">
          {/* Presets Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground">Presets</h3>

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
                    <span className="truncate">{preset.label.split(" ")[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Layout Presets */}
            <div className="space-y-1.5">
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
                      "h-auto flex-col gap-1 py-2 text-[10px]",
                      activeLayout === preset.id && "border-primary"
                    )}
                    onClick={() => setLayoutPreset(preset.id)}
                  >
                    {preset.icon}
                    <span className="truncate">{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="space-y-3 border-t pt-3">
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
          </div>

          {/* Corner & Ring */}
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Corner Radius */}
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

              {/* Ring Width */}
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
          </div>

          {/* Shadow & Brightness */}
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Shadow */}
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

              {/* Brightness */}
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
          </div>

          {/* Zoom */}
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-1.5">
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
          </div>

          {/* Transforms */}
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Transforms</span>
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
              {/* Rotate X */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">3D Rotate X</span>
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

              {/* Rotate Y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">3D Rotate Y</span>
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

              {/* Rotate Z */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">3D Rotate Z</span>
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

              {/* Perspective */}
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
          </div>

          {/* Canvas Background */}
          <div className="space-y-3 border-t pt-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Canvas Background
            </span>
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
              <div className="flex items-center gap-2 rounded-md border p-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Use Background Color</span>
              </div>
            )}

            {backgroundType === "video" && (
              <input
                type="text"
                placeholder="Video URL..."
                value={backgroundValue}
                onChange={(e) => setBackgroundValue(e.target.value)}
                className="h-8 w-full rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            )}

            {backgroundType === "image" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border p-2">
                  {backgroundValue ? (
                    <img
                      src={backgroundValue}
                      alt="Background preview"
                      className="h-6 w-6 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {backgroundValue ? backgroundValue.split('/').pop() : "No Image"}
                  </span>
                  {backgroundValue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setBackgroundValue("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setShowBackgroundPicker(true)}
                  >
                    Select
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  Set an image as a floating canvas background using fixed positioning. Supports JPG, PNG, WebP, and SVG formats.
                </p>
              </div>
            )}
          </div>

          {/* Canvas Overlay */}
          <div className="space-y-3 border-t pt-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Canvas Overlay
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border p-2">
                {overlayImage ? (
                  <img
                    src={overlayImage}
                    alt="Overlay preview"
                    className="h-6 w-6 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="flex-1 truncate text-xs text-muted-foreground">
                  {overlayImage ? overlayImage.split('/').pop() : "No Image"}
                </span>
                {overlayImage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setOverlayImage("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowOverlayPicker(true)}
                >
                  Select
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                Set an image as a canvas overlay with z-index 10 and pointer-events-none. Supports JPG, PNG, WebP, and SVG formats.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

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
