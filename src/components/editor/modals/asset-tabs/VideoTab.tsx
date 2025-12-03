"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Link, Check, AlertCircle, Play, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VideoTabProps {
  onSelectVideo: (data: { src: string; type: string }) => void;
  selectedSrc?: string;
}

const SUPPORTED_FORMATS = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const SUPPORTED_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];

export function VideoTab({ onSelectVideo, selectedSrc }: VideoTabProps) {
  const [mode, setMode] = useState<"upload" | "url">("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateVideoUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      const extension = url.split("?")[0].toLowerCase().slice(-4);
      // Check common video extensions
      return (
        SUPPORTED_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext)) ||
        url.includes("youtube.com") ||
        url.includes("vimeo.com") ||
        url.includes("cloudinary") ||
        url.includes("amazonaws")
      );
    } catch {
      return false;
    }
  }, []);

  const handleUrlChange = useCallback(
    (url: string) => {
      setVideoUrl(url);
      setError(null);
      setPreviewUrl(null);

      if (!url.trim()) return;

      if (validateVideoUrl(url)) {
        setPreviewUrl(url);
        onSelectVideo({ src: url, type: "url" });
      } else {
        setError("Please enter a valid video URL (MP4, WebM, OGG, MOV)");
      }
    },
    [validateVideoUrl, onSelectVideo]
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

      // Validate file size (max 50MB for now)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File too large. Maximum size is 50MB.");
        return;
      }

      setIsUploading(true);

      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "video");

        // Upload to API
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        const uploadedUrl = data.url;

        setPreviewUrl(uploadedUrl);
        onSelectVideo({ src: uploadedUrl, type: "upload" });
      } catch (err) {
        // Fallback: Create a blob URL for local preview
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
        onSelectVideo({ src: blobUrl, type: "local" });
        console.warn("Upload failed, using local preview:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [onSelectVideo]
  );

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setVideoUrl("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border p-1 bg-muted/30">
        <button
          onClick={() => {
            setMode("url");
            clearPreview();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "url"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Link className="h-4 w-4" />
          URL
        </button>
        <button
          onClick={() => {
            setMode("upload");
            clearPreview();
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "upload"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* URL Input */}
      {mode === "url" && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Video URL</label>
          <Input
            placeholder="https://example.com/video.mp4"
            value={videoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={cn(selectedSrc && selectedSrc === videoUrl && "border-green-500")}
          />
          <p className="text-xs text-muted-foreground">
            Paste a direct link to a video file (MP4, WebM, OGG, MOV)
          </p>
        </div>
      )}

      {/* Upload Area */}
      {mode === "upload" && (
        <div className="space-y-3">
          <label className="text-sm font-medium">Upload Video</label>
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
                  {SUPPORTED_EXTENSIONS.join(", ")} (max 50MB)
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

      {/* Video Preview */}
      {previewUrl && !error && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Preview</label>
            <Button variant="ghost" size="sm" onClick={clearPreview} className="h-7 px-2">
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              src={previewUrl}
              controls
              muted
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
            <Check className="h-4 w-4 shrink-0" />
            Video ready to use
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
        <div className="text-sm font-medium">Tips for video backgrounds:</div>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use short, looping videos (5-15 seconds)</li>
          <li>Optimize for web - compress your videos</li>
          <li>MP4 with H.264 codec works best across browsers</li>
          <li>Videos will autoplay muted and loop by default</li>
        </ul>
      </div>
    </div>
  );
}
