"use client";

import { RotateCcw, Move3D, Box } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { NumberInput } from "@/components/ui/number-input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TransformsSectionProps {
  transform: string;
  transformOrigin: string;
  perspective: string;
  onTransformChange: (property: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

const originPresets = [
  { name: "Center", value: "center" },
  { name: "Top", value: "top" },
  { name: "Bottom", value: "bottom" },
  { name: "Left", value: "left" },
  { name: "Right", value: "right" },
  { name: "Top Left", value: "top left" },
  { name: "Top Right", value: "top right" },
  { name: "Bottom Left", value: "bottom left" },
  { name: "Bottom Right", value: "bottom right" },
];

export function TransformsSection({
  transform,
  transformOrigin,
  perspective,
  onTransformChange,
  hasActiveProperties,
}: TransformsSectionProps) {
  // Parse transform values
  const parseTransformValue = (transformStr: string, transformType: string): number => {
    // Handle 3D transforms like translateX, translateY, translateZ, rotateX, etc.
    const regex3D = new RegExp(`${transformType}\\(([\\d.-]+)`);
    const match = transformStr?.match(regex3D);
    if (match) return parseFloat(match[1]);

    // Default values
    const defaults: Record<string, number> = {
      translateX: 0,
      translateY: 0,
      translateZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      skewX: 0,
      skewY: 0,
    };
    return defaults[transformType] ?? 0;
  };

  const translateX = parseTransformValue(transform, "translateX");
  const translateY = parseTransformValue(transform, "translateY");
  const translateZ = parseTransformValue(transform, "translateZ");
  const scaleX = parseTransformValue(transform, "scaleX");
  const scaleY = parseTransformValue(transform, "scaleY");
  const rotateX = parseTransformValue(transform, "rotateX");
  const rotateY = parseTransformValue(transform, "rotateY");
  const rotateZ = parseTransformValue(transform, "rotateZ");
  const skewX = parseTransformValue(transform, "skewX");
  const skewY = parseTransformValue(transform, "skewY");

  const buildTransformString = (updates: Record<string, number>) => {
    const values = {
      translateX: updates.translateX ?? translateX,
      translateY: updates.translateY ?? translateY,
      translateZ: updates.translateZ ?? translateZ,
      scaleX: updates.scaleX ?? scaleX,
      scaleY: updates.scaleY ?? scaleY,
      rotateX: updates.rotateX ?? rotateX,
      rotateY: updates.rotateY ?? rotateY,
      rotateZ: updates.rotateZ ?? rotateZ,
      skewX: updates.skewX ?? skewX,
      skewY: updates.skewY ?? skewY,
    };

    const parts: string[] = [];

    if (values.translateX !== 0 || values.translateY !== 0 || values.translateZ !== 0) {
      if (values.translateZ !== 0) {
        parts.push(`translate3d(${values.translateX}px, ${values.translateY}px, ${values.translateZ}px)`);
      } else if (values.translateX !== 0 || values.translateY !== 0) {
        parts.push(`translate(${values.translateX}px, ${values.translateY}px)`);
      }
    }

    if (values.scaleX !== 1 || values.scaleY !== 1) {
      parts.push(`scale(${values.scaleX}, ${values.scaleY})`);
    }

    if (values.rotateZ !== 0) {
      parts.push(`rotate(${values.rotateZ}deg)`);
    }
    if (values.rotateX !== 0) {
      parts.push(`rotateX(${values.rotateX}deg)`);
    }
    if (values.rotateY !== 0) {
      parts.push(`rotateY(${values.rotateY}deg)`);
    }

    if (values.skewX !== 0 || values.skewY !== 0) {
      parts.push(`skew(${values.skewX}deg, ${values.skewY}deg)`);
    }

    return parts.length > 0 ? parts.join(" ") : "none";
  };

  const updateTransform = (type: string, value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
    const newTransform = buildTransformString({ [type]: numValue });
    onTransformChange("transform", newTransform);
  };

  const resetTransforms = () => {
    onTransformChange("transform", "none");
  };

  return (
    <CollapsibleSection title="Transforms" icon={<Move3D className="h-4 w-4" />} hasActiveProperties={hasActiveProperties}>
      <div className="space-y-4">
        {/* Quick Reset */}
        <div className="flex justify-end">
          <button
            onClick={resetTransforms}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* 2D Transforms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Move3D className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">2D Transforms</span>
          </div>

          {/* Translate */}
          <div className="space-y-2 pl-5">
            <label className="text-[10px] text-muted-foreground">Translate</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">X</span>
                <NumberInput
                  value={translateX}
                  onChange={(v) => updateTransform("translateX", v)}
                  min={-500}
                  max={500}
                  unit="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground">Y</span>
                <NumberInput
                  value={translateY}
                  onChange={(v) => updateTransform("translateY", v)}
                  min={-500}
                  max={500}
                  unit="px"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-2 pl-5">
            <label className="text-[10px] text-muted-foreground">Scale</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">X</span>
                  <span className="text-[10px] text-muted-foreground">{scaleX.toFixed(2)}</span>
                </div>
                <Slider
                  value={[scaleX * 100]}
                  onValueChange={([v]) => updateTransform("scaleX", v / 100)}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Y</span>
                  <span className="text-[10px] text-muted-foreground">{scaleY.toFixed(2)}</span>
                </div>
                <Slider
                  value={[scaleY * 100]}
                  onValueChange={([v]) => updateTransform("scaleY", v / 100)}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>
            </div>
          </div>

          {/* Rotate (2D - Z axis) */}
          <div className="space-y-2 pl-5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground">Rotate</label>
              <span className="text-[10px] text-muted-foreground">{rotateZ}°</span>
            </div>
            <Slider
              value={[rotateZ]}
              onValueChange={([v]) => updateTransform("rotateZ", v)}
              min={-180}
              max={180}
              step={1}
            />
          </div>

          {/* Skew */}
          <div className="space-y-2 pl-5">
            <label className="text-[10px] text-muted-foreground">Skew</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">X</span>
                  <span className="text-[10px] text-muted-foreground">{skewX}°</span>
                </div>
                <Slider
                  value={[skewX]}
                  onValueChange={([v]) => updateTransform("skewX", v)}
                  min={-45}
                  max={45}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Y</span>
                  <span className="text-[10px] text-muted-foreground">{skewY}°</span>
                </div>
                <Slider
                  value={[skewY]}
                  onValueChange={([v]) => updateTransform("skewY", v)}
                  min={-45}
                  max={45}
                  step={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3D Transforms */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Box className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">3D Transforms</span>
          </div>

          {/* Perspective */}
          <div className="space-y-2 pl-5">
            <label className="text-[10px] text-muted-foreground">Perspective</label>
            <NumberInput
              value={parseFloat(perspective) || 0}
              onChange={(v) => {
                const numV = typeof v === "string" ? parseFloat(v) || 0 : v;
                onTransformChange("perspective", numV > 0 ? `${numV}px` : "none");
              }}
              min={0}
              max={2000}
              step={50}
              unit="px"
            />
          </div>

          {/* Translate Z */}
          <div className="space-y-2 pl-5">
            <label className="text-[10px] text-muted-foreground">Translate Z</label>
            <NumberInput
              value={translateZ}
              onChange={(v) => updateTransform("translateZ", v)}
              min={-500}
              max={500}
              unit="px"
            />
          </div>

          {/* Rotate X/Y */}
          <div className="space-y-2 pl-5">
            <label className="text-[10px] text-muted-foreground">3D Rotation</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">X</span>
                  <span className="text-[10px] text-muted-foreground">{rotateX}°</span>
                </div>
                <Slider
                  value={[rotateX]}
                  onValueChange={([v]) => updateTransform("rotateX", v)}
                  min={-180}
                  max={180}
                  step={1}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Y</span>
                  <span className="text-[10px] text-muted-foreground">{rotateY}°</span>
                </div>
                <Slider
                  value={[rotateY]}
                  onValueChange={([v]) => updateTransform("rotateY", v)}
                  min={-180}
                  max={180}
                  step={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transform Origin */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Transform Origin</label>
          <div className="flex flex-wrap gap-1">
            {originPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onTransformChange("transformOrigin", preset.value)}
                className={cn(
                  "h-6 px-2 rounded text-[10px] font-medium transition-colors hover:bg-muted",
                  transformOrigin === preset.value
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
