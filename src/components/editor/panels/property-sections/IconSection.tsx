"use client";

import { useState, useMemo, useEffect } from "react";
import { Shapes, RefreshCw, Loader2 } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { IconSelectorModal } from "@/components/editor/modals/IconSelectorModal";
import { Button } from "@/components/ui/button";
import { colorToHex } from "@/lib/color-utils";

interface IconSectionProps {
  currentSvg: string;
  iconColor: string;
  iconSize: string;
  onIconChange: (svgString: string) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
  iconifyIconName?: string; // For iconify-icon elements, the icon name (e.g., "mdi:arrow-right")
}

const presetColors = [
  { name: "Current", value: "currentColor" },
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Zinc 500", value: "#71717a" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
];

const presetSizes = ["16", "20", "24", "32", "40", "48", "64"];

export function IconSection({
  currentSvg,
  iconColor,
  iconSize,
  onIconChange,
  onColorChange,
  onSizeChange,
  iconifyIconName,
}: IconSectionProps) {
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [iconifySvg, setIconifySvg] = useState<string | null>(null);
  const [loadingIconify, setLoadingIconify] = useState(false);

  // Check if this is an iconify-icon element
  const isIconifyIcon = currentSvg.includes("<iconify-icon") || !!iconifyIconName;

  // Convert iconColor to HEX for the color input
  const hexIconColor = useMemo(() => {
    return colorToHex(iconColor, "#000000");
  }, [iconColor]);

  // Fetch SVG from Iconify API for iconify-icon elements
  useEffect(() => {
    if (!isIconifyIcon || !iconifyIconName) {
      setIconifySvg(null);
      return;
    }

    // Parse the icon name (format: "prefix:name" like "mdi:arrow-right")
    const [prefix, name] = iconifyIconName.split(":");
    if (!prefix || !name) {
      setIconifySvg(null);
      return;
    }

    setLoadingIconify(true);

    // Fetch from Iconify API
    fetch(`https://api.iconify.design/${prefix}/${name}.svg`)
      .then(res => {
        if (res.ok) return res.text();
        throw new Error("Failed to fetch icon");
      })
      .then(svg => {
        // Add size attributes to the SVG
        const sizedSvg = svg
          .replace(/width="[^"]*"/, `width="${iconSize}"`)
          .replace(/height="[^"]*"/, `height="${iconSize}"`);
        setIconifySvg(sizedSvg);
      })
      .catch(err => {
        console.error("Failed to fetch iconify icon:", err);
        setIconifySvg(null);
      })
      .finally(() => setLoadingIconify(false));
  }, [isIconifyIcon, iconifyIconName, iconSize]);

  const handleIconSelect = (svgString: string) => {
    onIconChange(svgString);
    setIsIconSelectorOpen(false);
  };

  // Determine what to display in the preview
  const previewContent = useMemo(() => {
    if (loadingIconify) {
      return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
    }
    if (isIconifyIcon && iconifySvg) {
      return (
        <div
          className="flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: iconifySvg }}
          style={{ color: iconColor }}
        />
      );
    }
    if (isIconifyIcon && iconifyIconName) {
      // Fallback: show the icon name if we couldn't fetch the SVG
      return (
        <span className="text-xs text-muted-foreground">
          {iconifyIconName}
        </span>
      );
    }
    // Regular SVG
    return (
      <div
        className="flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: currentSvg }}
        style={{ color: iconColor }}
      />
    );
  }, [loadingIconify, isIconifyIcon, iconifySvg, iconifyIconName, currentSvg, iconColor]);

  return (
    <CollapsibleSection title="Icon" icon={<Shapes className="h-4 w-4" />}>
      <div className="space-y-3">
        {/* Current Icon Preview */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Current Icon {isIconifyIcon && iconifyIconName && <span className="text-[10px] opacity-60">({iconifyIconName})</span>}
          </label>
          <div
            className="relative flex h-20 w-full items-center justify-center rounded-md border bg-muted/30 cursor-pointer group"
            onClick={() => setIsIconSelectorOpen(true)}
          >
            {previewContent}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
              <span className="text-white text-xs font-medium flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Change Icon
              </span>
            </div>
          </div>
        </div>

        {/* Change Icon Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setIsIconSelectorOpen(true)}
        >
          <Shapes className="h-4 w-4 mr-2" />
          Browse Icons
        </Button>

        {/* Icon Color */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={hexIconColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border bg-transparent"
            />
            <input
              type="text"
              value={iconColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder="currentColor"
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Preset Colors */}
          <div className="flex flex-wrap gap-1.5">
            {presetColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 ${
                  iconColor === color.value
                    ? "ring-2 ring-[hsl(var(--buildix-primary))] ring-offset-1"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    color.value === "currentColor" ? "#71717a" : color.value,
                }}
                title={color.name}
              >
                {color.value === "currentColor" && (
                  <span className="flex h-full w-full items-center justify-center text-[8px] text-white font-bold">
                    C
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Size */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <label className="text-xs text-muted-foreground">Size</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={iconSize}
              onChange={(e) => onSizeChange(e.target.value)}
              placeholder="24"
              className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="flex h-8 items-center text-xs text-muted-foreground">
              px
            </span>
          </div>

          {/* Preset Sizes */}
          <div className="flex flex-wrap gap-1.5">
            {presetSizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={`h-7 min-w-[32px] rounded-md border px-2 text-xs transition-colors hover:bg-muted ${
                  iconSize === size || iconSize === `${size}px`
                    ? "bg-muted border-[hsl(var(--buildix-primary))]"
                    : ""
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Selector Modal */}
        <IconSelectorModal
          open={isIconSelectorOpen}
          onOpenChange={setIsIconSelectorOpen}
          onSelectIcon={handleIconSelect}
          currentColor={iconColor}
          currentSize={iconSize}
        />
      </div>
    </CollapsibleSection>
  );
}
