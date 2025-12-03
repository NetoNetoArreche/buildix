"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageGrid, ImageItem } from "../ImageGrid";
import { useDebounce } from "@/hooks/useDebounce";

interface BuildixGalleryTabProps {
  searchQuery: string;
  category: string | null;
  color: string | null;
  aspectRatio: string | null;
  onSelect: (url: string) => void;
}

export function BuildixGalleryTab({
  searchQuery,
  category,
  color,
  aspectRatio,
  onSelect,
}: BuildixGalleryTabProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 500);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();

      if (debouncedQuery) {
        params.set("query", debouncedQuery);
      }
      if (category) {
        params.set("category", category);
      }
      if (color) {
        params.set("color", color);
      }
      if (aspectRatio && aspectRatio !== "all") {
        params.set("aspectRatio", aspectRatio);
      }

      const response = await fetch(`/api/images/buildix?${params}`);
      const data = await response.json();

      if (data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("Failed to fetch Buildix gallery:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, category, color, aspectRatio]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleSelect = (image: ImageItem) => {
    setSelectedId(image.id);
    onSelect(image.url);
  };

  return (
    <ImageGrid
      images={images}
      isLoading={isLoading}
      selectedId={selectedId}
      onSelect={handleSelect}
      emptyMessage="No images in the Buildix gallery yet"
    />
  );
}
