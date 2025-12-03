"use client";

import { useState, useCallback, useEffect } from "react";
import { ExternalLink, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmbedType } from "@/types";

interface EmbedTabProps {
  onSelectEmbed: (data: { src: string; type: EmbedType; code?: string }) => void;
  selectedSrc?: string;
}

interface EmbedPreset {
  id: string;
  name: string;
  type: EmbedType;
  description: string;
  baseUrl: string;
  placeholder: string;
  docsUrl: string;
  validateInput: (input: string) => { isValid: boolean; id?: string; fullUrl?: string };
}

// Unicorn Studio embed URL format: https://unicorn.studio/embed/PROJECT_ID
// Spline embed URL format: https://my.spline.design/PROJECT_ID

const EMBED_PRESETS: EmbedPreset[] = [
  {
    id: "unicorn",
    name: "Unicorn Studio",
    type: "unicorn",
    description: "Animated WebGL backgrounds",
    baseUrl: "https://unicorn.studio/embed/",
    placeholder: "ZHhDKfVqqu8PKOSMwfuA",
    docsUrl: "https://www.unicorn.studio/",
    validateInput: (input: string) => {
      const trimmed = input.trim();

      // Check if it's already a full URL
      if (trimmed.includes("unicorn.studio") || trimmed.includes("unicornstudio.com")) {
        // Extract ID from URL
        const match = trimmed.match(/(?:unicorn\.studio|unicornstudio\.com)\/embed\/([a-zA-Z0-9_-]+)/);
        if (match) {
          return {
            isValid: true,
            id: match[1],
            fullUrl: `https://unicorn.studio/embed/${match[1]}`
          };
        }
        // Try to get the last part of the URL as ID
        const urlParts = trimmed.split('/').filter(Boolean);
        const possibleId = urlParts[urlParts.length - 1];
        if (possibleId && /^[a-zA-Z0-9_-]+$/.test(possibleId)) {
          return {
            isValid: true,
            id: possibleId,
            fullUrl: `https://unicorn.studio/embed/${possibleId}`
          };
        }
      }

      // Check if it's just an ID (alphanumeric string)
      if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length >= 10) {
        return {
          isValid: true,
          id: trimmed,
          fullUrl: `https://unicorn.studio/embed/${trimmed}`
        };
      }

      return { isValid: false };
    },
  },
  {
    id: "spline",
    name: "Spline",
    type: "spline",
    description: "3D interactive scenes",
    baseUrl: "https://my.spline.design/",
    placeholder: "untitled-abc123xyz",
    docsUrl: "https://spline.design/",
    validateInput: (input: string) => {
      const trimmed = input.trim();

      // Check if it's already a full URL
      if (trimmed.includes("spline.design")) {
        // Extract path from URL
        const match = trimmed.match(/spline\.design\/([a-zA-Z0-9_/-]+)/);
        if (match) {
          return {
            isValid: true,
            id: match[1],
            fullUrl: `https://my.spline.design/${match[1]}`
          };
        }
      }

      // Check if it's just an ID/slug
      if (/^[a-zA-Z0-9_/-]+$/.test(trimmed) && trimmed.length >= 5) {
        return {
          isValid: true,
          id: trimmed,
          fullUrl: `https://my.spline.design/${trimmed}`
        };
      }

      return { isValid: false };
    },
  },
];

function parseEmbedCode(code: string): { src: string; type: EmbedType } | null {
  const trimmed = code.trim();

  // Check if it's just a Unicorn Studio ID (alphanumeric string, 10+ chars)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length >= 10 && trimmed.length <= 30) {
    return {
      src: `https://unicorn.studio/embed/${trimmed}`,
      type: "unicorn"
    };
  }

  // Try to extract iframe src
  const iframeSrcMatch = code.match(/src=["']([^"']+)["']/);
  if (iframeSrcMatch) {
    const src = iframeSrcMatch[1];
    // Detect type from URL
    if (src.includes("unicorn")) return { src, type: "unicorn" };
    if (src.includes("spline")) return { src, type: "spline" };
    return { src, type: "custom" };
  }

  // Try to find script data-scene attribute (Spline)
  const dataSceneMatch = code.match(/data-scene=["']([^"']+)["']/);
  if (dataSceneMatch) {
    return { src: dataSceneMatch[1], type: "spline" };
  }

  // Check if it's a direct URL
  if (code.startsWith("http")) {
    if (code.includes("unicorn")) return { src: code, type: "unicorn" };
    if (code.includes("spline")) return { src: code, type: "spline" };
    return { src: code, type: "custom" };
  }

  return null;
}

export function EmbedTab({ onSelectEmbed, selectedSrc }: EmbedTabProps) {
  const [inputValue, setInputValue] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null);

  // Initialize state from selectedSrc when editing
  useEffect(() => {
    if (selectedSrc) {
      setValidatedUrl(selectedSrc);

      // Detect preset type from URL and set appropriate state
      if (selectedSrc.includes("unicorn")) {
        setActivePreset("unicorn");
        // Extract ID from URL
        const match = selectedSrc.match(/embed\/([a-zA-Z0-9_-]+)/);
        if (match) {
          setInputValue(match[1]);
        }
      } else if (selectedSrc.includes("spline")) {
        setActivePreset("spline");
        // Extract path from URL
        const match = selectedSrc.match(/spline\.design\/([a-zA-Z0-9_/-]+)/);
        if (match) {
          setInputValue(match[1]);
        }
      } else {
        setActivePreset("custom");
        setEmbedCode(selectedSrc);
      }
    }
  }, [selectedSrc]);

  // Handle input change for presets (ID or URL)
  const handleInputChange = useCallback(
    (value: string, preset: EmbedPreset) => {
      setInputValue(value);
      setError(null);
      setValidatedUrl(null);

      if (!value.trim()) return;

      const result = preset.validateInput(value);
      if (result.isValid && result.fullUrl) {
        setValidatedUrl(result.fullUrl);
        onSelectEmbed({
          src: result.fullUrl,
          type: preset.type
        });
      } else {
        setError(`Invalid ${preset.name} ID or URL`);
      }
    },
    [onSelectEmbed]
  );

  // Handle embed code change for custom embeds
  const handleEmbedCodeChange = useCallback(
    (code: string) => {
      setEmbedCode(code);
      setError(null);
      setValidatedUrl(null);

      if (!code.trim()) return;

      const parsed = parseEmbedCode(code);
      if (parsed) {
        setValidatedUrl(parsed.src);
        onSelectEmbed({ ...parsed, code });
        setActivePreset(parsed.type === "custom" ? "custom" : parsed.type);
      } else {
        setError("Could not parse embed code. Please paste a valid iframe or embed code.");
      }
    },
    [onSelectEmbed]
  );

  // Handle preset selection
  const handlePresetClick = useCallback((preset: EmbedPreset | "custom") => {
    if (preset === "custom") {
      setActivePreset("custom");
    } else {
      setActivePreset(preset.id);
    }
    setInputValue("");
    setEmbedCode("");
    setError(null);
    setValidatedUrl(null);
  }, []);

  // Get current preset
  const currentPreset = EMBED_PRESETS.find((p) => p.id === activePreset);

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Choose Platform</label>
        <div className="grid grid-cols-2 gap-3">
          {EMBED_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                "relative p-4 rounded-lg border text-left transition-all hover:border-[hsl(var(--buildix-primary))]/50",
                activePreset === preset.id
                  ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
                  : "border-border"
              )}
            >
              {activePreset === preset.id && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-[hsl(var(--buildix-primary))]" />
                </div>
              )}
              <div className="font-medium">{preset.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {preset.description}
              </div>
              <a
                href={preset.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-[hsl(var(--buildix-primary))] hover:underline mt-2"
              >
                Visit site
                <ExternalLink className="h-3 w-3" />
              </a>
            </button>
          ))}
        </div>
      </div>

      {/* Custom embed option */}
      <button
        onClick={() => handlePresetClick("custom")}
        className={cn(
          "w-full p-3 rounded-lg border text-left transition-all hover:border-[hsl(var(--buildix-primary))]/50",
          activePreset === "custom"
            ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/5"
            : "border-border"
        )}
      >
        <div className="font-medium text-sm">Custom Embed</div>
        <div className="text-xs text-muted-foreground">
          Paste any iframe or embed code
        </div>
      </button>

      {/* ID/URL Input for presets */}
      {currentPreset && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {currentPreset.name} ID or URL
          </label>
          <div className="flex gap-2">
            <Input
              placeholder={currentPreset.placeholder}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value, currentPreset)}
              className={cn(
                "flex-1",
                validatedUrl && "border-green-500"
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Paste the project ID or full embed URL from {currentPreset.name}
          </p>
        </div>
      )}

      {/* Embed Code Textarea (for custom) */}
      {activePreset === "custom" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Unicorn ID or Embed Code</label>
          <Textarea
            placeholder="ZHhDKfVqqu8PKOSMwfuA or paste iframe code..."
            value={embedCode}
            onChange={(e) => handleEmbedCodeChange(e.target.value)}
            rows={4}
            className={cn(
              "font-mono text-xs",
              validatedUrl && "border-green-500"
            )}
          />
          <p className="text-xs text-muted-foreground">
            Paste the Unicorn Studio ID, URL, or full iframe embed code
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Success indicator */}
      {validatedUrl && !error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
          <Check className="h-4 w-4 shrink-0" />
          Embed source detected and ready to use
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
        <div className="text-sm font-medium">How to get embed code:</div>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Go to Unicorn Studio or Spline and create your design</li>
          <li>Click the &quot;Export&quot; or &quot;Share&quot; button</li>
          <li>Copy the <strong>project ID</strong> or embed URL</li>
          <li>Paste it above</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-2">
          <strong>Tip:</strong> For Unicorn Studio, the ID looks like: <code className="bg-muted px-1 rounded">ZHhDKfVqqu8PKOSMwfuA</code>
        </p>
      </div>
    </div>
  );
}
