"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Check, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, getPreviewIframe } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import {
  detectColorsInDocument,
  groupColorsByName,
  replaceColorFamily,
  replaceColorInDocument,
  applyThemeToDocument,
  filterColorsByType,
  getColorTypeLabel,
  type ColorGroup,
  type DetectedColor,
  type DetectedColorType,
} from "@/lib/color-detection";
import { tailwindColors } from "@/lib/color-presets";

interface ColorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Theme presets - exactly like the screenshots
const themePresets = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Clean dark theme with neutral tones",
    primary: "blue",
    neutral: "slate",
    preview: {
      bg: "#1e293b",
      accent1: "#f97316",
      accent2: "#3b82f6",
      bar: "#64748b",
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool blues and teals",
    primary: "teal",
    neutral: "slate",
    preview: {
      bg: "#134e4a",
      accent1: "#f97316",
      accent2: "#2dd4bf",
      bar: "#14b8a6",
    },
  },
  {
    id: "sunset-glow",
    name: "Sunset Glow",
    description: "Warm oranges and ambers",
    primary: "orange",
    neutral: "stone",
    preview: {
      bg: "#7c2d12",
      accent1: "#f97316",
      accent2: "#fb923c",
      bar: "#ea580c",
    },
  },
  {
    id: "forest-night",
    name: "Forest Night",
    description: "Natural greens and emeralds",
    primary: "emerald",
    neutral: "neutral",
    preview: {
      bg: "#064e3b",
      accent1: "#10b981",
      accent2: "#34d399",
      bar: "#059669",
    },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    description: "Elegant violets and indigos",
    primary: "violet",
    neutral: "zinc",
    preview: {
      bg: "#4c1d95",
      accent1: "#8b5cf6",
      accent2: "#a78bfa",
      bar: "#7c3aed",
    },
  },
  {
    id: "rose-garden",
    name: "Rose Garden",
    description: "Soft pinks and roses",
    primary: "rose",
    neutral: "zinc",
    preview: {
      bg: "#881337",
      accent1: "#f43f5e",
      accent2: "#fb7185",
      bar: "#e11d48",
    },
  },
];

// Color families for the palette grid
const colorFamilies = [
  { id: "slate", name: "Slate", shades: tailwindColors.slate },
  { id: "gray", name: "Gray", shades: tailwindColors.gray },
  { id: "zinc", name: "Zinc", shades: tailwindColors.zinc },
  { id: "neutral", name: "Neutral", shades: tailwindColors.neutral },
  { id: "stone", name: "Stone", shades: tailwindColors.stone },
  { id: "red", name: "Red", shades: tailwindColors.red },
  { id: "orange", name: "Orange", shades: tailwindColors.orange },
  { id: "amber", name: "Amber", shades: tailwindColors.amber },
  { id: "yellow", name: "Yellow", shades: tailwindColors.yellow },
  { id: "lime", name: "Lime", shades: tailwindColors.lime },
  { id: "green", name: "Green", shades: tailwindColors.green },
  { id: "emerald", name: "Emerald", shades: tailwindColors.emerald },
  { id: "teal", name: "Teal", shades: tailwindColors.teal },
  { id: "cyan", name: "Cyan", shades: tailwindColors.cyan },
  { id: "sky", name: "Sky", shades: tailwindColors.sky },
  { id: "blue", name: "Blue", shades: tailwindColors.blue },
  { id: "indigo", name: "Indigo", shades: tailwindColors.indigo },
  { id: "violet", name: "Violet", shades: tailwindColors.violet },
  { id: "purple", name: "Purple", shades: tailwindColors.purple },
  { id: "fuchsia", name: "Fuchsia", shades: tailwindColors.fuchsia },
  { id: "pink", name: "Pink", shades: tailwindColors.pink },
  { id: "rose", name: "Rose", shades: tailwindColors.rose },
];

// Filter types for individual colors
const colorFilterTypes: { value: DetectedColorType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "text", label: "Text" },
  { value: "background", label: "Background" },
  { value: "border", label: "Border" },
  { value: "hover", label: "Hover" },
  { value: "gradient", label: "Gradient" },
];

export function ColorsModal({ open, onOpenChange }: ColorsModalProps) {
  const { setHtmlContent } = useEditorStore();

  // State
  const [activeTab, setActiveTab] = useState<"palette" | "themes">("palette");
  const [paletteView, setPaletteView] = useState<"groups" | "individual">("groups");
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ColorGroup | null>(null);
  const [selectedReplacement, setSelectedReplacement] = useState<string | null>(null);

  // Individual colors state
  const [allColors, setAllColors] = useState<DetectedColor[]>([]);
  const [typeFilter, setTypeFilter] = useState<DetectedColorType | "all">("all");
  const [selectedIndividualColor, setSelectedIndividualColor] = useState<DetectedColor | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Scan colors from iframe
  const scanColors = useCallback(() => {
    setIsScanning(true);

    try {
      const iframe = getPreviewIframe();
      if (!iframe?.contentDocument) {
        setColorGroups([]);
        setAllColors([]);
        return;
      }

      const detected = detectColorsInDocument(iframe.contentDocument);
      const groups = groupColorsByName(detected);
      setColorGroups(groups);
      setAllColors(detected);

      if (groups.length > 0 && !selectedGroup) {
        setSelectedGroup(groups[0]);
      }
    } catch (error) {
      console.error("[ColorsModal] Error scanning colors:", error);
      setColorGroups([]);
      setAllColors([]);
    } finally {
      setIsScanning(false);
    }
  }, [selectedGroup]);

  // Scan when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(scanColors, 200);
      return () => clearTimeout(timer);
    }
  }, [open, scanColors]);

  // Helper to save iframe changes
  const saveIframeChanges = useCallback(() => {
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;
    const docClone = doc.documentElement.cloneNode(true) as HTMLElement;

    docClone.querySelectorAll("[data-buildix-id]").forEach((el) => {
      el.removeAttribute("data-buildix-id");
    });
    docClone.querySelectorAll(".buildix-hoverable, .buildix-selected").forEach((el) => {
      el.classList.remove("buildix-hoverable", "buildix-selected");
    });
    docClone.querySelectorAll("#buildix-selection-styles").forEach((el) => el.remove());
    docClone.querySelectorAll(".buildix-element-label, .buildix-action-bar, .buildix-spacing-label").forEach((el) => el.remove());

    const updatedHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;
    setHtmlContent(updatedHtml);

    const allIframes = document.querySelectorAll('iframe[title^="Preview"]') as NodeListOf<HTMLIFrameElement>;
    allIframes.forEach((f) => {
      f.srcdoc = updatedHtml;
    });

    setTimeout(scanColors, 300);
  }, [setHtmlContent, scanColors]);

  // Get filtered colors based on type filter
  const filteredColors = typeFilter === "all"
    ? allColors
    : filterColorsByType(allColors, typeFilter);

  // Apply individual color replacement
  const applyIndividualColorReplacement = useCallback((color: DetectedColor, newColorClass: string) => {
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const result = replaceColorInDocument(iframe.contentDocument, color.className, newColorClass);

    if (result.success) {
      saveIframeChanges();
      setSelectedIndividualColor(null);
      setShowColorPicker(false);
    }
  }, [saveIframeChanges]);

  // Apply color replacement
  const applyColorReplacement = useCallback((newColorName: string) => {
    if (!selectedGroup) return;

    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const oldColorName = selectedGroup.name.toLowerCase();
    const result = replaceColorFamily(iframe.contentDocument, oldColorName, newColorName);

    if (result.success) {
      setSelectedReplacement(newColorName);
      saveIframeChanges();
    }
  }, [selectedGroup, saveIframeChanges]);

  // Apply theme preset
  const applyThemePreset = useCallback((theme: typeof themePresets[0]) => {
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const result = applyThemeToDocument(iframe.contentDocument, {
      primary: theme.primary,
      neutral: theme.neutral,
    });

    if (result.success) {
      saveIframeChanges();
    }
  }, [saveIframeChanges]);

  // Get shades to display for color palette
  const getDisplayShades = (shades: Record<string, string>) => {
    const displayKeys = ["100", "200", "400", "500", "600", "800"];
    return displayKeys.map(k => shades[k]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] h-[720px] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xs text-white">◎</span>
            </div>
            <span className="text-base font-semibold text-white">Color Manager</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground"
            onClick={scanColors}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isScanning && "animate-spin")} />
            Rescan
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab("palette")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === "palette"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>✦</span>
              Color Palette
            </button>
            <button
              onClick={() => setActiveTab("themes")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
                activeTab === "themes"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>✧</span>
              Theme Presets
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "palette" ? (
            <div className="flex flex-col h-full">
              {/* Sub-tabs for palette view */}
              <div className="px-6 py-3 border-b border-[#262626] flex gap-4">
                <button
                  onClick={() => setPaletteView("groups")}
                  className={cn(
                    "text-sm font-medium transition-all pb-1 border-b-2",
                    paletteView === "groups"
                      ? "text-white border-primary"
                      : "text-[#737373] border-transparent hover:text-white"
                  )}
                >
                  Color Groups
                </button>
                <button
                  onClick={() => setPaletteView("individual")}
                  className={cn(
                    "text-sm font-medium transition-all pb-1 border-b-2",
                    paletteView === "individual"
                      ? "text-white border-primary"
                      : "text-[#737373] border-transparent hover:text-white"
                  )}
                >
                  Individual Classes
                </button>
              </div>

              {paletteView === "groups" ? (
                /* Groups View */
                <div className="flex flex-1 overflow-hidden">
                  {/* Left Sidebar - Detected Colors */}
                  <div className="w-[200px] border-r border-[#262626] flex flex-col">
                    <div className="px-4 py-3 text-xs font-semibold text-[#737373] uppercase tracking-wider">
                      Detected Colors ({colorGroups.length})
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="px-3 pb-3 space-y-1">
                        {colorGroups.map((group) => (
                          <button
                            key={group.name}
                            onClick={() => {
                              setSelectedGroup(group);
                              setSelectedReplacement(null);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left",
                              selectedGroup?.name === group.name
                                ? "bg-[#262626]"
                                : "hover:bg-[#171717]"
                            )}
                          >
                            <div
                              className="w-6 h-6 rounded-md border border-[#404040] shrink-0"
                              style={{ backgroundColor: group.displayColor }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{group.name}</div>
                              <div className="text-xs text-[#737373]">
                                {group.usageCount} uses
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#525252] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Right Panel - Replace With */}
                  <div className="flex-1 flex flex-col">
                    {selectedGroup ? (
                      <>
                        {/* Selected Color Header */}
                        <div className="px-6 py-5 border-b border-[#262626]">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-16 h-16 rounded-xl border border-[#404040]"
                              style={{ backgroundColor: selectedGroup.displayColor }}
                            />
                            <div>
                              <h3 className="text-xl font-bold text-white">{selectedGroup.name}</h3>
                              <p className="text-sm text-[#737373] mt-1">
                                Used in {selectedGroup.usageCount} elements
                              </p>
                            </div>
                          </div>
                        </div>

                    {/* Shades in Use */}
                    <div className="px-6 py-4 border-b border-[#262626]">
                      <div className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-3">
                        Shades in Use
                      </div>
                      <div className="flex gap-2">
                        {selectedGroup.colors.slice(0, 10).map((color, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-lg border border-[#404040]"
                            style={{ backgroundColor: color.colorValue }}
                            title={color.displayName}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Replace With Grid */}
                    <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col">
                      <div className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-4">
                        Replace With
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="grid grid-cols-3 gap-3 pr-3">
                          {colorFamilies.map((family) => {
                            const isSelected = selectedReplacement === family.id ||
                              (selectedReplacement === null && selectedGroup.name.toLowerCase() === family.id);
                            const shades = getDisplayShades(family.shades);

                            return (
                              <button
                                key={family.id}
                                onClick={() => applyColorReplacement(family.id)}
                                className={cn(
                                  "flex flex-col gap-2 p-3 rounded-xl border-2 transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-[#262626] hover:border-[#404040] bg-[#171717]"
                                )}
                              >
                                <div className="flex gap-0.5">
                                  {shades.map((hex, idx) => (
                                    <div
                                      key={idx}
                                      className="flex-1 h-6 first:rounded-l-md last:rounded-r-md"
                                      style={{ backgroundColor: hex }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-[#a3a3a3]">{family.name}</span>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-[#737373]">
                        <span className="text-sm">Select a color to replace</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Individual Classes View */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Filters */}
                  <div className="px-6 py-3 border-b border-[#262626]">
                    <div className="flex flex-wrap gap-2">
                      {colorFilterTypes.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setTypeFilter(filter.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                            typeFilter === filter.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-[#262626] text-[#a3a3a3] hover:bg-[#333333]"
                          )}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-[#737373]">
                      Found {filteredColors.length} colors matching your filter
                    </div>
                  </div>

                  {/* Individual Color List */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                      {filteredColors.map((color, idx) => (
                        <div
                          key={`${color.className}-${idx}`}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all",
                            selectedIndividualColor?.className === color.className
                              ? "border-primary bg-primary/10"
                              : "border-[#262626] hover:border-[#404040] bg-[#171717]"
                          )}
                        >
                          {/* Color Preview */}
                          <div
                            className="w-8 h-8 rounded-md border border-[#404040] shrink-0"
                            style={{ backgroundColor: color.colorValue }}
                          />

                          {/* Color Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-white truncate">
                              {color.className}
                            </div>
                            <div className="text-xs text-[#737373]">
                              {getColorTypeLabel(color.type)} · {color.usageCount} {color.usageCount === 1 ? "use" : "uses"}
                            </div>
                          </div>

                          {/* Change Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs shrink-0"
                            onClick={() => {
                              setSelectedIndividualColor(color);
                              setShowColorPicker(true);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ))}

                      {filteredColors.length === 0 && (
                        <div className="text-center py-8 text-[#737373]">
                          <span className="text-sm">No colors found for this filter</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Color Picker Panel */}
                  {showColorPicker && selectedIndividualColor && (
                    <div className="border-t border-[#262626] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-white">
                          Replace: <span className="font-mono text-[#a3a3a3]">{selectedIndividualColor.className}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            setShowColorPicker(false);
                            setSelectedIndividualColor(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      <ScrollArea className="h-[120px]">
                        <div className="grid grid-cols-6 gap-2">
                          {colorFamilies.map((family) => {
                            const shades = Object.entries(family.shades);
                            return shades.map(([shade, hex]) => {
                              const newClass = selectedIndividualColor.className.replace(
                                /-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
                                `-${family.id}-${shade}`
                              );
                              return (
                                <button
                                  key={`${family.id}-${shade}`}
                                  onClick={() => applyIndividualColorReplacement(selectedIndividualColor, newClass)}
                                  className="w-8 h-8 rounded-md border border-[#404040] hover:scale-110 transition-transform"
                                  style={{ backgroundColor: hex }}
                                  title={`${family.name} ${shade}`}
                                />
                              );
                            });
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Theme Presets Tab */
            <ScrollArea className="h-full">
              <div className="p-6">
                <p className="text-sm text-[#737373] mb-6">
                  Apply a complete color scheme to transform your design instantly.
                </p>
                <div className="grid grid-cols-2 gap-5">
                  {themePresets.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => applyThemePreset(theme)}
                      className="flex flex-col rounded-2xl border border-[#262626] overflow-hidden transition-all hover:border-[#404040] hover:shadow-lg bg-[#171717]"
                    >
                      {/* Theme Preview */}
                      <div
                        className="h-36 p-5 flex flex-col justify-between"
                        style={{ backgroundColor: theme.preview.bg }}
                      >
                        {/* Top bar */}
                        <div
                          className="h-2 w-20 rounded-full"
                          style={{ backgroundColor: theme.preview.bar }}
                        />
                        {/* Color circles */}
                        <div className="flex gap-3 justify-center">
                          <div
                            className="w-12 h-12 rounded-xl"
                            style={{ backgroundColor: theme.preview.accent1 }}
                          />
                          <div
                            className="w-12 h-12 rounded-xl"
                            style={{ backgroundColor: theme.preview.accent2 }}
                          />
                        </div>
                        {/* Bottom bar */}
                        <div
                          className="h-1.5 w-24 rounded-full self-center"
                          style={{ backgroundColor: theme.preview.bar }}
                        />
                      </div>

                      {/* Theme Info */}
                      <div className="p-4 text-left">
                        <h4 className="font-bold text-white text-base">{theme.name}</h4>
                        <p className="text-xs text-[#737373] mt-1">{theme.description}</p>
                        {/* Color dots */}
                        <div className="flex gap-1.5 mt-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.preview.accent1 }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.preview.accent2 }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.preview.bar }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
