"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, Pencil, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageGrid, ImageItem } from "../ImageGrid";

interface AIGenerateTabProps {
  onSelect: (url: string) => void;
}

const STYLE_PRESETS = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "abstract", label: "Abstract" },
  { value: "minimal", label: "Minimal" },
  { value: "gradient", label: "Gradient" },
  { value: "3d-render", label: "3D Render" },
  { value: "illustration", label: "Illustration" },
  { value: "watercolor", label: "Watercolor" },
  { value: "geometric", label: "Geometric" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "4:3", label: "Standard (4:3)" },
];

export function AIGenerateTab({ onSelect }: AIGenerateTabProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/images/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      setError("Failed to generate images. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = (image: ImageItem) => {
    setSelectedId(image.id);
    onSelect(image.url);
  };

  const handleEditImage = async () => {
    if (!editingImage || !editPrompt.trim()) return;

    setIsEditing(true);
    setError(null);

    try {
      const response = await fetch("/api/images/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: editingImage.url,
          editPrompt: editPrompt.trim(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setSelectedId(data.image.id);
        onSelect(data.image.url);
        setIsEditMode(false);
        setEditingImage(null);
        setEditPrompt("");
      }
    } catch (error) {
      console.error("AI edit failed:", error);
      setError("Failed to edit image. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleBackFromEdit = () => {
    setIsEditMode(false);
    setEditingImage(null);
    setEditPrompt("");
    setError(null);
  };

  // Edit mode UI
  if (isEditMode && editingImage) {
    return (
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackFromEdit}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">Edit Image with AI</h3>
        </div>

        {/* Image Preview */}
        <div className="relative flex-shrink-0 rounded-lg overflow-hidden bg-muted aspect-video max-h-[200px] flex items-center justify-center">
          <img
            src={editingImage.url}
            alt={editingImage.alt || "Image to edit"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Edit Prompt Input */}
        <div className="space-y-3">
          <div className="relative">
            <Pencil className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Describe what changes you want to make..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditImage();
                }
              }}
            />
          </div>

          <Button
            variant="buildix"
            onClick={handleEditImage}
            disabled={isEditing || !editPrompt.trim()}
            className="w-full"
          >
            {isEditing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            <span className="ml-2">{isEditing ? "Editing..." : "Apply Edit"}</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Edit Suggestions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Remove the background",
              "Make it brighter",
              "Add a blue sky",
              "Change colors to warm tones",
              "Add more contrast",
              "Make it look vintage",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setEditPrompt(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normal generate mode UI
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Prompt Input */}
      <div className="space-y-3">
        <div className="relative">
          <Wand2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
        </div>

        {/* Style & Aspect Ratio */}
        <div className="flex gap-2">
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Style (optional)" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ratio) => (
                <SelectItem key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="buildix"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2">Generate</span>
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generated Images */}
      <div className="flex-1 overflow-hidden">
        {images.length === 0 && !isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">Generate with AI</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Describe the image you want and our AI will create it for you.
              Perfect for unique backgrounds and illustrations.
            </p>
          </div>
        ) : (
          <ImageGrid
            images={images}
            isLoading={isGenerating}
            selectedId={selectedId}
            onSelect={handleImageSelect}
            emptyMessage="No images generated yet"
          />
        )}
      </div>
    </div>
  );
}
