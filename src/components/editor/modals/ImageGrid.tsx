"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id: string;
  url: string;
  thumb: string;
  alt?: string;
  width?: number;
  height?: number;
  author?: string;
  source: string;
}

interface ImageGridProps {
  images: ImageItem[];
  isLoading?: boolean;
  selectedId?: string | null;
  onSelect: (image: ImageItem) => void;
  emptyMessage?: string;
}

export function ImageGrid({
  images,
  isLoading,
  selectedId,
  onSelect,
  emptyMessage = "No images found",
}: ImageGridProps) {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleImageError = (id: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-1">
      <div className="grid grid-cols-3 gap-2 auto-rows-max">
        {images.map((image) => {
          // Calculate aspect ratio for proper display
          const aspectRatio = image.width && image.height
            ? image.width / image.height
            : 1;
          // Use aspect-video for landscape, aspect-square for square/portrait
          const aspectClass = aspectRatio > 1.3 ? "aspect-video" : "aspect-square";

          return (
            <button
              key={image.id}
              onClick={() => onSelect(image)}
              className={cn(
                "group relative overflow-hidden rounded-lg border-2 transition-all hover:border-[hsl(var(--buildix-primary))]",
                aspectClass,
                selectedId === image.id
                  ? "border-[hsl(var(--buildix-primary))] ring-2 ring-[hsl(var(--buildix-primary))]/20"
                  : "border-transparent"
              )}
            >
              {loadingImages.has(image.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={image.thumb}
                alt={image.alt || "Image"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onLoad={() => handleImageLoad(image.id)}
                onError={() => handleImageError(image.id)}
                loading="lazy"
              />
              {selectedId === image.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="rounded-full bg-[hsl(var(--buildix-primary))] p-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              {image.author && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs text-white">{image.author}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
