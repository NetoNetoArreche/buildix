"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { BackgroundAsset, BlendModeType, AlphaMaskType } from "@/types";

interface AssetControlsPanelProps {
  asset: BackgroundAsset;
  onUpdate: (updates: Partial<BackgroundAsset>) => void;
}

const BLEND_MODES: { value: BlendModeType; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
];

const ALPHA_MASK_TYPES: { value: AlphaMaskType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "top", label: "Fade Top" },
  { value: "bottom", label: "Fade Bottom" },
  { value: "left", label: "Fade Left" },
  { value: "right", label: "Fade Right" },
  { value: "radial", label: "Radial" },
];

const OBJECT_FIT_OPTIONS = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "fill", label: "Fill" },
  { value: "none", label: "None" },
];

export function AssetControlsPanel({ asset, onUpdate }: AssetControlsPanelProps) {
  const handleSliderChange = useCallback(
    (property: keyof BackgroundAsset, value: number) => {
      onUpdate({ [property]: value });
    },
    [onUpdate]
  );

  const handleAlphaMaskChange = useCallback(
    (updates: Partial<BackgroundAsset["alphaMask"]>) => {
      onUpdate({
        alphaMask: { ...asset.alphaMask, ...updates },
      });
    },
    [asset.alphaMask, onUpdate]
  );

  return (
    <div className="space-y-6">
      {/* Color Adjustments */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Color Adjustments
        </div>

        {/* Hue */}
        <SliderControl
          label="Hue"
          value={asset.hue ?? 0}
          min={0}
          max={360}
          unit="°"
          onChange={(v) => handleSliderChange("hue", v)}
        />

        {/* Saturation */}
        <SliderControl
          label="Saturation"
          value={asset.saturation ?? 100}
          min={0}
          max={200}
          unit="%"
          defaultValue={100}
          onChange={(v) => handleSliderChange("saturation", v)}
        />

        {/* Brightness */}
        <SliderControl
          label="Brightness"
          value={asset.brightness ?? 100}
          min={0}
          max={200}
          unit="%"
          defaultValue={100}
          onChange={(v) => handleSliderChange("brightness", v)}
        />
      </div>

      {/* Effects */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Effects
        </div>

        {/* Blur */}
        <SliderControl
          label="Blur"
          value={asset.blur ?? 0}
          min={0}
          max={50}
          unit="px"
          onChange={(v) => handleSliderChange("blur", v)}
        />

        {/* Opacity */}
        <SliderControl
          label="Opacity"
          value={asset.opacity ?? 100}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => handleSliderChange("opacity", v)}
        />

        {/* Invert */}
        <div className="flex items-center justify-between">
          <label className="text-sm">Invert</label>
          <button
            onClick={() => onUpdate({ invert: !asset.invert })}
            className={cn(
              "w-10 h-5 rounded-full transition-colors relative",
              asset.invert ? "bg-[hsl(var(--buildix-primary))]" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                asset.invert ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Alpha Mask */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Alpha Mask
        </div>

        {/* Mask Type */}
        <div className="space-y-2">
          <label className="text-sm">Type</label>
          <select
            value={asset.alphaMask?.type ?? "none"}
            onChange={(e) =>
              handleAlphaMaskChange({
                type: e.target.value as AlphaMaskType,
                enabled: e.target.value !== "none",
              })
            }
            className="w-full h-8 rounded border bg-background px-2 text-sm"
          >
            {ALPHA_MASK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mask Intensity */}
        {asset.alphaMask?.type !== "none" && (
          <SliderControl
            label="Intensity"
            value={asset.alphaMask?.intensity ?? 50}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => handleAlphaMaskChange({ intensity: v })}
          />
        )}
      </div>

      {/* Blend & Composition */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Blend & Composition
        </div>

        {/* Blend Mode */}
        <div className="space-y-2">
          <label className="text-sm">Blend Mode</label>
          <select
            value={asset.blendMode ?? "normal"}
            onChange={(e) => onUpdate({ blendMode: e.target.value as BlendModeType })}
            className="w-full h-8 rounded border bg-background px-2 text-sm"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {/* Z-Index */}
        <div className="space-y-2">
          <label className="text-sm">Z-Index</label>
          <input
            type="number"
            value={asset.zIndex ?? -1}
            onChange={(e) => onUpdate({ zIndex: parseInt(e.target.value) || -1 })}
            className="w-full h-8 rounded border bg-background px-2 text-sm"
          />
        </div>
      </div>

      {/* Positioning */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Positioning
        </div>

        {/* Position Type */}
        <div className="flex rounded-lg border p-1 bg-muted/30">
          <button
            onClick={() => onUpdate({ position: "fixed" })}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              asset.position === "fixed"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Fixed
          </button>
          <button
            onClick={() => onUpdate({ position: "absolute" })}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              asset.position === "absolute"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Absolute
          </button>
        </div>

        {/* Object Fit */}
        <div className="space-y-2">
          <label className="text-sm">Object Fit</label>
          <select
            value={asset.objectFit ?? "cover"}
            onChange={(e) =>
              onUpdate({ objectFit: e.target.value as BackgroundAsset["objectFit"] })
            }
            className="w-full h-8 rounded border bg-background px-2 text-sm"
          >
            {OBJECT_FIT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Width & Height */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Width</label>
            <input
              type="text"
              value={asset.width ?? "100%"}
              onChange={(e) => onUpdate({ width: e.target.value })}
              className="w-full h-8 rounded border bg-background px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Height</label>
            <input
              type="text"
              value={asset.height ?? "100%"}
              onChange={(e) => onUpdate({ height: e.target.value })}
              className="w-full h-8 rounded border bg-background px-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Interaction */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Interaction
        </div>

        {/* Pointer Events */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm">Pointer Events</label>
            <p className="text-xs text-muted-foreground">Allow click-through</p>
          </div>
          <button
            onClick={() =>
              onUpdate({
                pointerEvents: asset.pointerEvents === "none" ? "auto" : "none",
              })
            }
            className={cn(
              "w-10 h-5 rounded-full transition-colors relative",
              asset.pointerEvents === "none"
                ? "bg-[hsl(var(--buildix-primary))]"
                : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                asset.pointerEvents === "none" ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Slider Control Component
interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  defaultValue?: number;
  onChange: (value: number) => void;
}

function SliderControl({
  label,
  value,
  min,
  max,
  unit = "",
  defaultValue,
  onChange,
}: SliderControlProps) {
  const isDefault = defaultValue !== undefined && value === defaultValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm">{label}</label>
        <span
          className={cn(
            "text-xs tabular-nums",
            isDefault ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[hsl(var(--buildix-primary))]
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-white
          [&::-webkit-slider-thumb]:shadow
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
