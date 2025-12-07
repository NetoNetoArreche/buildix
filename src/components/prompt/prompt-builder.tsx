"use client";

import { useState } from "react";
import {
  X,
  Wand2,
  Layout,
  Grid3X3,
  Palette,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  Monitor,
  Frame,
  Type,
  Play,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  Layers,
  Users,
  FileText,
  Bell,
  Image,
  CreditCard,
  Square,
  List,
  LayoutGrid,
  Table,
  PanelLeft,
  PanelRight,
  AlignCenter,
  Maximize,
  AppWindow,
  Laptop,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/uiStore";
import {
  PROMPT_BUILDER_OPTIONS,
  buildPromptFromOptions,
} from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

interface PromptBuilderProps {
  onGenerate: (prompt: string) => void;
  onClose?: () => void;
}

// Icon mapping for layout types
const layoutTypeIcons: Record<string, React.ReactNode> = {
  hero: <Layout className="h-4 w-4" />,
  features: <Grid3X3 className="h-4 w-4" />,
  onboarding: <Users className="h-4 w-4" />,
  docs: <FileText className="h-4 w-4" />,
  updates: <Bell className="h-4 w-4" />,
  portfolio: <Image className="h-4 w-4" />,
  pricing: <CreditCard className="h-4 w-4" />,
  landing: <Layers className="h-4 w-4" />,
};

// Icon mapping for layout configs
const layoutConfigIcons: Record<string, React.ReactNode> = {
  card: <Square className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  "grid-2x2": <LayoutGrid className="h-4 w-4" />,
  table: <Table className="h-4 w-4" />,
  "sidebar-left": <PanelLeft className="h-4 w-4" />,
  "sidebar-right": <PanelRight className="h-4 w-4" />,
  centered: <AlignCenter className="h-4 w-4" />,
  masonry: <LayoutGrid className="h-4 w-4" />,
};

// Icon mapping for framing
const framingIcons: Record<string, React.ReactNode> = {
  "full-screen": <Maximize className="h-4 w-4" />,
  card: <Square className="h-4 w-4" />,
  browser: <Monitor className="h-4 w-4" />,
  "mac-app": <AppWindow className="h-4 w-4" />,
  "clay-web": <Box className="h-4 w-4" />,
};

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-sm font-medium text-zinc-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function PromptBuilder({ onGenerate, onClose }: PromptBuilderProps) {
  const { closeModal } = useUIStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeModal();
    }
  };

  // State for all options
  const [layoutType, setLayoutType] = useState("landing");
  const [layoutConfig, setLayoutConfig] = useState("centered");
  const [framing, setFraming] = useState("full-screen");
  const [style, setStyle] = useState("flat");
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("violet");
  const [backgroundColor, setBackgroundColor] = useState("zinc-950");
  const [borderColor, setBorderColor] = useState("zinc-800");
  const [shadow, setShadow] = useState("md");
  const [typefaceType, setTypefaceType] = useState("sans");
  const [headingFont, setHeadingFont] = useState("inter");
  const [animation, setAnimation] = useState("fade");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  const handleReset = () => {
    setLayoutType("landing");
    setLayoutConfig("centered");
    setFraming("full-screen");
    setStyle("flat");
    setTheme("dark");
    setAccentColor("violet");
    setBackgroundColor("zinc-950");
    setBorderColor("zinc-800");
    setShadow("md");
    setTypefaceType("sans");
    setHeadingFont("inter");
    setAnimation("fade");
    setAdditionalInstructions("");
    setSelectedPrompts([]);
  };

  const handleGenerate = () => {
    let prompt = buildPromptFromOptions({
      layoutType,
      layoutConfig,
      framing,
      style,
      theme,
      accentColor,
      backgroundColor,
      borderColor,
      shadow,
      typefaceType,
      headingFont,
      animation,
      additionalInstructions,
    });

    // Add selected generated prompts
    if (selectedPrompts.length > 0) {
      const promptTexts = selectedPrompts
        .map((id) => {
          const found = PROMPT_BUILDER_OPTIONS.generatedPrompts.find((p) => p.id === id);
          return found?.prompt;
        })
        .filter(Boolean);
      if (promptTexts.length > 0) {
        prompt += " " + promptTexts.join(". ");
      }
    }

    onGenerate(prompt);
    handleClose();
  };

  const togglePrompt = (id: string) => {
    setSelectedPrompts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const generatedPrompt = buildPromptFromOptions({
    layoutType,
    layoutConfig,
    framing,
    style,
    theme,
    accentColor,
    backgroundColor,
    borderColor,
    shadow,
    typefaceType,
    headingFont,
    animation,
    additionalInstructions,
  });

  const getAccentHex = (value: string) => {
    return PROMPT_BUILDER_OPTIONS.accentColors.find((c) => c.value === value)?.hex || "#8b5cf6";
  };

  const getBgHex = (value: string) => {
    return PROMPT_BUILDER_OPTIONS.backgroundColors.find((c) => c.value === value)?.hex || "#09090b";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
              <Wand2 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Prompt Builder</h2>
              <p className="text-sm text-zinc-400">
                Configure your design parameters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Options */}
          <div className="flex-1 overflow-hidden border-r border-zinc-800">
            <ScrollArea className="h-full">
              <div className="divide-y divide-zinc-800/50">
                {/* Layout Type */}
                <CollapsibleSection title="LAYOUT TYPE" icon={<Layout className="h-4 w-4" />}>
                  <div className="grid grid-cols-4 gap-2">
                    {PROMPT_BUILDER_OPTIONS.layoutTypes.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLayoutType(option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          layoutType === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <span className="text-lg">{layoutTypeIcons[option.value]}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Layout Configuration */}
                <CollapsibleSection title="LAYOUT CONFIGURATION" icon={<Grid3X3 className="h-4 w-4" />}>
                  <div className="grid grid-cols-4 gap-2">
                    {PROMPT_BUILDER_OPTIONS.layoutConfigs.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLayoutConfig(option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          layoutConfig === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <span className="text-lg">{layoutConfigIcons[option.value]}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Framing */}
                <CollapsibleSection title="FRAMING" icon={<Frame className="h-4 w-4" />}>
                  <div className="grid grid-cols-5 gap-2">
                    {PROMPT_BUILDER_OPTIONS.framing.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFraming(option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          framing === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <span className="text-lg">{framingIcons[option.value]}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Style */}
                <CollapsibleSection title="STYLE" icon={<Sparkles className="h-4 w-4" />}>
                  <div className="grid grid-cols-6 gap-2">
                    {PROMPT_BUILDER_OPTIONS.styles.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStyle(option.value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                          style === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Theme */}
                <CollapsibleSection title="THEME" icon={<Sun className="h-4 w-4" />}>
                  <div className="flex gap-2">
                    {PROMPT_BUILDER_OPTIONS.themes.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 transition-all",
                          theme === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        {option.value === "dark" ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Sun className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Colors Row */}
                <CollapsibleSection title="COLORS" icon={<Palette className="h-4 w-4" />}>
                  <div className="space-y-4">
                    {/* Accent Color */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Accent Color</label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_BUILDER_OPTIONS.accentColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setAccentColor(color.value)}
                            className={cn(
                              "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                              accentColor === color.value
                                ? "border-white/50 ring-2 ring-white/20"
                                : "border-transparent hover:border-zinc-600"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          >
                            {accentColor === color.value && (
                              <Check className="h-4 w-4 text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Background Color</label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_BUILDER_OPTIONS.backgroundColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setBackgroundColor(color.value)}
                            className={cn(
                              "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                              backgroundColor === color.value
                                ? "border-violet-500/50 ring-2 ring-violet-500/20"
                                : "border-zinc-700 hover:border-zinc-600"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          >
                            {backgroundColor === color.value && (
                              <Check className="h-4 w-4 text-violet-400 drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border & Shadow */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Border Color</label>
                        <div className="flex flex-wrap gap-2">
                          {PROMPT_BUILDER_OPTIONS.borderColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setBorderColor(color.value)}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs transition-all",
                                borderColor === color.value
                                  ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                  : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                              )}
                            >
                              {color.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Shadow</label>
                        <div className="flex flex-wrap gap-2">
                          {PROMPT_BUILDER_OPTIONS.shadows.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setShadow(s.value)}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs transition-all",
                                shadow === s.value
                                  ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                  : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                              )}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Typography */}
                <CollapsibleSection title="TYPEFACE FAMILY" icon={<Type className="h-4 w-4" />}>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Type</label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_BUILDER_OPTIONS.typefaceTypes.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setTypefaceType(t.value)}
                            className={cn(
                              "rounded-lg border px-4 py-2 text-xs font-medium transition-all",
                              typefaceType === t.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Heading Font</label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_BUILDER_OPTIONS.headingFonts.map((f) => (
                          <button
                            key={f.value}
                            onClick={() => setHeadingFont(f.value)}
                            className={cn(
                              "rounded-lg border px-4 py-2 text-xs font-medium transition-all",
                              headingFont === f.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Animation */}
                <CollapsibleSection title="ANIMATION TYPE" icon={<Play className="h-4 w-4" />}>
                  <div className="grid grid-cols-7 gap-2">
                    {PROMPT_BUILDER_OPTIONS.animations.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setAnimation(a.value)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                          animation === a.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                        )}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Additional Instructions */}
                <CollapsibleSection title="ADDITIONAL INSTRUCTIONS" icon={<FileText className="h-4 w-4" />} defaultOpen={false}>
                  <textarea
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="Add any specific requirements or details..."
                    className="min-h-[100px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                  />
                </CollapsibleSection>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Generated Prompts & Preview */}
          <div className="flex w-96 flex-col bg-zinc-900/50">
            {/* Generated Prompts Section */}
            <div className="border-b border-zinc-800 p-4">
              <h3 className="mb-1 text-sm font-semibold text-zinc-200">GENERATED PROMPTS</h3>
              <p className="text-xs text-zinc-500">Select prompts to add to your configuration</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {PROMPT_BUILDER_OPTIONS.generatedPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => togglePrompt(prompt.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      selectedPrompts.includes(prompt.id)
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-zinc-800 bg-zinc-800/20 hover:border-zinc-700 hover:bg-zinc-800/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all",
                        selectedPrompts.includes(prompt.id)
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-zinc-700 bg-zinc-800"
                      )}
                    >
                      {selectedPrompts.includes(prompt.id) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Plus className="h-3 w-3 text-zinc-500" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        selectedPrompts.includes(prompt.id) ? "text-violet-300" : "text-zinc-400"
                      )}
                    >
                      {prompt.label}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Preview & Generate */}
            <div className="border-t border-zinc-800 p-4 space-y-4">
              {/* Mini Preview */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <h4 className="mb-2 text-xs font-medium text-zinc-500 uppercase">Preview</h4>
                <div
                  className="h-24 rounded-lg border border-zinc-700 flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: getBgHex(backgroundColor),
                    borderColor: borderColor === "accent" ? getAccentHex(accentColor) : undefined,
                  }}
                >
                  <div
                    className="h-3 w-16 rounded-full"
                    style={{ backgroundColor: getAccentHex(accentColor) }}
                  />
                </div>
              </div>

              {/* Generated Prompt Text */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                <p className="text-xs text-zinc-400 line-clamp-3">{generatedPrompt}</p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl py-3 transition-all shadow-lg shadow-violet-500/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
