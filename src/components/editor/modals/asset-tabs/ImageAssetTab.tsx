"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Link, Check, AlertCircle, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ImageAssetTabProps {
  onSelectImage: (url: string) => void;
  selectedSrc?: string;
}

const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];

// Sample preset images for quick selection
const PRESET_IMAGES = [
  {
    category: "Gradients",
    images: [
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
      "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&q=80",
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
    ],
  },
  {
    category: "Abstract",
    images: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80",
      "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
      "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=800&q=80",
    ],
  },
  {
    category: "Dark",
    images: [
      "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&q=80",
      "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80",
      "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80",
      "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&q=80",
    ],
  },
];

export function ImageAssetTab({ onSelectImage, selectedSrc }: ImageAssetTabProps) {
  const [mode, setMode] = useState<"presets" | "url" | "upload">("presets");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleUrlChange = useCallback(
    (url: string) => {
      setImageUrl(url);
      setError(null);

      if (!url.trim()) return;

      if (validateImageUrl(url)) {
        onSelectImage(url);
      } else {
        setError("Please enter a valid image URL");
      }
    },
    [validateImageUrl, onSelectImage]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);

      // Validate file type
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        setError(`Unsupported format. Please use: ${SUPPORTED_EXTENSIONS.join(", ")}`);
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      setIsUploading(true);

      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "image");

        // Upload to API
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        onSelectImage(data.url);
      } catch (err) {
        // Fallback: Create a blob URL for local preview
        const blobUrl = URL.createObjectURL(file);
        onSelectImage(blobUrl);
        console.warn("Upload failed, using local preview:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [onSelectImage]
  );

  const handlePresetSelect = useCallback(
    (url: string) => {
      onSelectImage(url);
    },
    [onSelectImage]
  );

  const clearSelection = useCallback(() => {
    setImageUrl("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border p-1 bg-muted/30">
        <button
          onClick={() => setMode("presets")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "presets"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="h-4 w-4" />
          Presets
        </button>
        <button
          onClick={() => setMode("url")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "url"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link className="h-4 w-4" />
          URL
        </button>
        <button
          onClick={() => setMode("upload")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "upload"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Presets */}
      {mode === "presets" && (
        <div className="space-y-4">
          {PRESET_IMAGES.map((category) => (
            <div key={category.category} className="space-y-2">
              <label className="text-sm font-medium">{category.category}</label>
              <div className="grid grid-cols-4 gap-2">
                {category.images.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetSelect(url)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:border-[hsl(var(--buildix-primary))]/50",
                      selectedSrc === url
                        ? "border-[hsl(var(--buildix-primary))] ring-2 ring-[hsl(var(--buildix-primary))]/20"
                        : "border-transparent"
                    )}
                  >
                    <img
                      src={url}
                      alt={`${category.category} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedSrc === url && (
                      <div className="absolute inset-0 bg-[hsl(var(--buildix-primary))]/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* URL Input */}
      {mode === "url" && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Image URL</label>
          <Input
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={cn(selectedSrc && selectedSrc === imageUrl && "border-green-500")}
          />
          <p className="text-xs text-muted-foreground">
            Paste a direct link to an image (JPG, PNG, WebP, SVG, GIF)
          </p>

          {/* URL Preview */}
          {imageUrl && validateImageUrl(imageUrl) && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={() => setError("Failed to load image")}
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      {mode === "upload" && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Upload Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
              isUploading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-[hsl(var(--buildix-primary))]/50 hover:bg-muted/30"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  {SUPPORTED_EXTENSIONS.join(", ")} (max 10MB)
                </span>
              </>
            )}
          </button>
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
      {selectedSrc && !error && mode !== "presets" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
          <Check className="h-4 w-4 shrink-0" />
          Image ready to use
        </div>
      )}
    </div>
  );
}
