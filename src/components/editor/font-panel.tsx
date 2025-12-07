"use client";

import { useState, useCallback, useMemo } from "react";
import {
  X,
  Type,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Search,
  Sparkles,
  LetterText,
  ALargeSmall,
  MoveHorizontal,
  Bold,
  Italic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FontPanelProps {
  onClose: () => void;
  onApplyFont?: (config: FontConfig) => void;
  currentHtml?: string;
}

interface FontConfig {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  bodyWeight: string;
  headingSpacing: string;
  bodySpacing: string;
}

// Available fonts
const AVAILABLE_FONTS = [
  { name: "Inter", category: "sans-serif", popular: true },
  { name: "Geist", category: "sans-serif", popular: true },
  { name: "Roboto", category: "sans-serif", popular: true },
  { name: "Montserrat", category: "sans-serif", popular: true },
  { name: "Poppins", category: "sans-serif", popular: true },
  { name: "Playfair Display", category: "serif", popular: true },
  { name: "Instrument Serif", category: "serif", popular: false },
  { name: "Merriweather", category: "serif", popular: true },
  { name: "Bricolage Grotesque", category: "sans-serif", popular: false },
  { name: "Plus Jakarta Sans", category: "sans-serif", popular: true },
  { name: "Manrope", category: "sans-serif", popular: true },
  { name: "Space Grotesk", category: "sans-serif", popular: false },
  { name: "Geist Mono", category: "monospace", popular: false },
  { name: "Space Mono", category: "monospace", popular: false },
  { name: "JetBrains Mono", category: "monospace", popular: false },
  { name: "Quicksand", category: "sans-serif", popular: false },
  { name: "Nunito", category: "sans-serif", popular: true },
  { name: "Work Sans", category: "sans-serif", popular: false },
  { name: "PT Serif", category: "serif", popular: false },
  { name: "Lora", category: "serif", popular: false },
  { name: "DM Sans", category: "sans-serif", popular: true },
  { name: "Outfit", category: "sans-serif", popular: false },
  { name: "Sora", category: "sans-serif", popular: false },
  { name: "Figtree", category: "sans-serif", popular: false },
];

// Font pairings
const FONT_PAIRINGS = [
  { heading: "Inter", body: "Inter", label: "Modern Clean" },
  { heading: "Geist", body: "Geist", label: "Tech Modern" },
  { heading: "Manrope", body: "Inter", label: "Friendly Pro" },
  { heading: "Playfair Display", body: "Geist", label: "Elegant Tech" },
  { heading: "Instrument Serif", body: "Inter", label: "Editorial" },
  { heading: "Plus Jakarta Sans", body: "Geist", label: "Startup" },
  { heading: "Nunito", body: "Nunito", label: "Soft Rounded" },
  { heading: "Bricolage Grotesque", body: "Inter", label: "Bold Statement" },
  { heading: "Space Grotesk", body: "Geist", label: "Geometric" },
  { heading: "Geist Mono", body: "Geist Mono", label: "Developer" },
  { heading: "Quicksand", body: "Quicksand", label: "Playful" },
  { heading: "Montserrat", body: "Manrope", label: "Classic SaaS" },
];

// Font weights
const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extrabold" },
];

// Letter spacing
const LETTER_SPACINGS = [
  { value: "-0.05em", label: "Tighter" },
  { value: "-0.025em", label: "Tight" },
  { value: "0", label: "Default" },
  { value: "0.025em", label: "Wide" },
  { value: "0.05em", label: "Wider" },
  { value: "0.1em", label: "Widest" },
];

export function FontPanel({ onClose, onApplyFont, currentHtml }: FontPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFonts, setSelectedFonts] = useState<string[]>([
    "Inter",
    "Geist",
    "Manrope",
    "Poppins",
    "Playfair Display",
  ]);
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [headingWeight, setHeadingWeight] = useState("600");
  const [bodyWeight, setBodyWeight] = useState("400");
  const [headingSpacing, setHeadingSpacing] = useState("-0.025em");
  const [bodySpacing, setBodySpacing] = useState("0");
  const [activeTab, setActiveTab] = useState<"fonts" | "pairings" | "settings">("fonts");

  // Detected font styles from current HTML (mock data for now)
  const detectedStyles = useMemo(() => [
    { size: "60px", weight: "600", font: "Inter", usage: 4 },
    { size: "48px", weight: "500", font: "Inter", usage: 1 },
    { size: "30px", weight: "600", font: "Inter", usage: 1 },
    { size: "20px", weight: "500", font: "Inter", usage: 6 },
    { size: "16px", weight: "400", font: "Inter", usage: 15 },
    { size: "14px", weight: "400", font: "Inter", usage: 30 },
    { size: "14px", weight: "500", font: "Inter", usage: 11 },
  ], []);

  const filteredFonts = useMemo(() => {
    if (!searchQuery) return AVAILABLE_FONTS;
    return AVAILABLE_FONTS.filter((font) =>
      font.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleFont = useCallback((fontName: string) => {
    setSelectedFonts((prev) =>
      prev.includes(fontName)
        ? prev.filter((f) => f !== fontName)
        : [...prev, fontName]
    );
  }, []);

  const applyPairing = useCallback((pairing: typeof FONT_PAIRINGS[0]) => {
    setHeadingFont(pairing.heading);
    setBodyFont(pairing.body);
    if (!selectedFonts.includes(pairing.heading)) {
      setSelectedFonts((prev) => [...prev, pairing.heading]);
    }
    if (!selectedFonts.includes(pairing.body)) {
      setSelectedFonts((prev) => [...prev, pairing.body]);
    }
  }, [selectedFonts]);

  const handleApply = useCallback(() => {
    if (onApplyFont) {
      onApplyFont({
        headingFont,
        bodyFont,
        headingWeight,
        bodyWeight,
        headingSpacing,
        bodySpacing,
      });
    }
    onClose();
  }, [onApplyFont, onClose, headingFont, bodyFont, headingWeight, bodyWeight, headingSpacing, bodySpacing]);

  const removeUnusedFonts = useCallback(() => {
    // Keep only the fonts that are being used (heading and body)
    setSelectedFonts([headingFont, bodyFont].filter((f, i, arr) => arr.indexOf(f) === i));
  }, [headingFont, bodyFont]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
              <Type className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Font Selection</h2>
              <p className="text-xs text-zinc-500">Configure typography for your design</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50">
          {[
            { id: "fonts", label: "Fonts", icon: <ALargeSmall className="h-4 w-4" /> },
            { id: "pairings", label: "Pairings", icon: <Sparkles className="h-4 w-4" /> },
            { id: "settings", label: "Settings", icon: <LetterText className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2",
                activeTab === tab.id
                  ? "border-violet-500 text-violet-400 bg-violet-500/5"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === "fonts" && (
            <div className="p-5 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="pl-10 bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500"
                />
              </div>

              {/* Imported Fonts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-300">Imported Fonts</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeUnusedFonts}
                    className="h-7 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove Unused
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFonts.map((font) => (
                    <button
                      key={font}
                      onClick={() => toggleFont(font)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 transition-all"
                      style={{ fontFamily: font }}
                    >
                      {font}
                      <X className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Fonts */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">
                  {searchQuery ? "Search Results" : "Available Fonts"}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filteredFonts.map((font) => {
                    const isSelected = selectedFonts.includes(font.name);
                    return (
                      <button
                        key={font.name}
                        onClick={() => toggleFont(font.name)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left",
                          isSelected
                            ? "border-violet-500/50 bg-violet-500/10"
                            : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"
                        )}
                      >
                        <div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-violet-300" : "text-zinc-300"
                            )}
                            style={{ fontFamily: font.name }}
                          >
                            {font.name}
                          </span>
                          <span className="ml-2 text-[10px] text-zinc-600 uppercase">
                            {font.category}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md border transition-all",
                            isSelected
                              ? "border-violet-500 bg-violet-500 text-white"
                              : "border-zinc-700 bg-zinc-800"
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3 text-zinc-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "pairings" && (
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-500 mb-4">
                Select a font pairing to quickly apply to your design
              </p>
              <div className="grid grid-cols-2 gap-3">
                {FONT_PAIRINGS.map((pairing) => {
                  const isActive = headingFont === pairing.heading && bodyFont === pairing.body;
                  return (
                    <button
                      key={pairing.label}
                      onClick={() => applyPairing(pairing)}
                      className={cn(
                        "flex flex-col rounded-xl border p-4 text-left transition-all",
                        isActive
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700"
                      )}
                    >
                      <span
                        className={cn(
                          "text-lg font-semibold mb-1",
                          isActive ? "text-violet-300" : "text-zinc-200"
                        )}
                        style={{ fontFamily: pairing.heading }}
                      >
                        {pairing.heading}
                      </span>
                      <span
                        className="text-sm text-zinc-500"
                        style={{ fontFamily: pairing.body }}
                      >
                        {pairing.body}
                      </span>
                      <span className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">
                        {pairing.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-5 space-y-6">
              {/* Heading Font Settings */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">Headings</h3>
                    <p className="text-xs text-zinc-500">Size &gt; 20px</p>
                  </div>
                  <select
                    value={headingFont}
                    onChange={(e) => setHeadingFont(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                    style={{ fontFamily: headingFont }}
                  >
                    {selectedFonts.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bold className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Weight</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FONT_WEIGHTS.map((weight) => (
                      <button
                        key={weight.value}
                        onClick={() => setHeadingWeight(weight.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          headingWeight === weight.value
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        {weight.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacing */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MoveHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Letter Spacing</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LETTER_SPACINGS.map((spacing) => (
                      <button
                        key={spacing.value}
                        onClick={() => setHeadingSpacing(spacing.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          headingSpacing === spacing.value
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        {spacing.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Body Font Settings */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-200">Body Text</h3>
                    <p className="text-xs text-zinc-500">Size ≤ 20px</p>
                  </div>
                  <select
                    value={bodyFont}
                    onChange={(e) => setBodyFont(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                    style={{ fontFamily: bodyFont }}
                  >
                    {selectedFonts.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bold className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Weight</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FONT_WEIGHTS.map((weight) => (
                      <button
                        key={weight.value}
                        onClick={() => setBodyWeight(weight.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          bodyWeight === weight.value
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        {weight.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacing */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MoveHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs text-zinc-500">Letter Spacing</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LETTER_SPACINGS.map((spacing) => (
                      <button
                        key={spacing.value}
                        onClick={() => setBodySpacing(spacing.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          bodySpacing === spacing.value
                            ? "bg-violet-500/20 text-violet-300 border border-violet-500/50"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                        )}
                      >
                        {spacing.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detected Font Styles */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Detected Font Styles</h3>
                <div className="space-y-2">
                  {detectedStyles.map((style, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-zinc-800 bg-zinc-800/20 p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {style.size} - {style.weight}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {style.font} - Used {style.usage} times
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {FONT_WEIGHTS.map((weight) => (
                          <button
                            key={weight.value}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-medium transition-all",
                              style.weight === weight.value
                                ? "bg-violet-500/20 text-violet-300"
                                : "bg-zinc-800/50 text-zinc-500"
                            )}
                          >
                            {weight.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/80">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">
              <span className="text-violet-400 font-medium">{selectedFonts.length}</span> fonts imported
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
