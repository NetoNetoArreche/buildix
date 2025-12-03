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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

export function PromptBuilder({ onGenerate, onClose }: PromptBuilderProps) {
  const { closeModal } = useUIStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeModal();
    }
  };
  const [layoutType, setLayoutType] = useState("landing");
  const [layoutConfig, setLayoutConfig] = useState("centered");
  const [style, setStyle] = useState("elevated");
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("violet");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const handleReset = () => {
    setLayoutType("landing");
    setLayoutConfig("centered");
    setStyle("elevated");
    setTheme("dark");
    setAccentColor("violet");
    setAdditionalInstructions("");
  };

  const handleGenerate = () => {
    const prompt = buildPromptFromOptions({
      layoutType,
      layoutConfig,
      style,
      theme,
      accentColor,
      additionalInstructions,
    });
    onGenerate(prompt);
    handleClose();
  };

  const generatedPrompt = buildPromptFromOptions({
    layoutType,
    layoutConfig,
    style,
    theme,
    accentColor,
    additionalInstructions,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--buildix-primary))]/10">
              <Wand2 className="h-5 w-5 text-[hsl(var(--buildix-primary))]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Prompt Builder</h2>
              <p className="text-sm text-muted-foreground">
                Configure your design options
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Options */}
          <ScrollArea className="flex-1 border-r">
            <div className="space-y-6 p-6">
              {/* Layout Type */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Layout Type</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PROMPT_BUILDER_OPTIONS.layoutTypes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLayoutType(option.value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all",
                        layoutType === option.value
                          ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Layout Configuration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">
                    Layout Configuration
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PROMPT_BUILDER_OPTIONS.layoutConfigs.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLayoutConfig(option.value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all",
                        layoutConfig === option.value
                          ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Style */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Visual Style</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PROMPT_BUILDER_OPTIONS.styles.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStyle(option.value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all",
                        style === option.value
                          ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Theme */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Theme</label>
                <div className="flex gap-2">
                  {PROMPT_BUILDER_OPTIONS.themes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 transition-all",
                        theme === option.value
                          ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      {option.value === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Accent Color */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Accent Color</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_BUILDER_OPTIONS.accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                        accentColor === color.value
                          ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
                          : "hover:border-muted-foreground/50"
                      )}
                    >
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{
                          backgroundColor: getColorValue(color.value),
                        }}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Additional Instructions */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Add any specific requirements or details..."
                  className="min-h-[80px] w-full resize-none rounded-lg border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Preview */}
          <div className="flex w-80 flex-col">
            <div className="border-b p-4">
              <h3 className="font-medium">Generated Prompt</h3>
              <p className="text-sm text-muted-foreground">
                This prompt will be sent to the AI
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed">{generatedPrompt}</p>
                </div>
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <Button
                variant="buildix"
                className="w-full"
                onClick={handleGenerate}
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

function getColorValue(colorName: string): string {
  const colors: Record<string, string> = {
    violet: "#8b5cf6",
    blue: "#3b82f6",
    cyan: "#06b6d4",
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
    pink: "#ec4899",
    indigo: "#6366f1",
  };
  return colors[colorName] || "#8b5cf6";
}
