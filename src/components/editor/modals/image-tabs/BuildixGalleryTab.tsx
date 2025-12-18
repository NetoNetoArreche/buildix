"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ImageGrid, ImageItem } from "../ImageGrid";
import { useDebounce } from "@/hooks/useDebounce";

interface BuildixGalleryTabProps {
  searchQuery: string;
  category: string | null;
  color: string | null;
  aspectRatio: string | null;
  onSelect: (url: string) => void;
}

// Note: category can be "all", null, or a specific category name
// - "all" or null means fetch all images (no category filter)
// - any other value filters by that category

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
  const isFirstRender = useRef(true);

  const debouncedQuery = useDebounce(searchQuery, 500);

  const fetchImages = useCallback(async (categoryOverride?: string | null) => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();

      // Always request a larger limit to show more images
      params.set("limit", "50");

      if (debouncedQuery) {
        params.set("query", debouncedQuery);
      }
      // Use categoryOverride if provided, otherwise use category prop
      // Don't set category param if null/undefined (will fetch all)
      const categoryToUse = categoryOverride !== undefined ? categoryOverride : category;
      if (categoryToUse && categoryToUse !== "all") {
        params.set("category", categoryToUse);
      }
      if (color) {
        params.set("color", color);
      }
      if (aspectRatio && aspectRatio !== "all") {
        params.set("aspectRatio", aspectRatio);
      }

      console.log("[BuildixGalleryTab] Fetching with params:", params.toString());
      const response = await fetch(`/api/images/buildix?${params}`);
      const data = await response.json();
      console.log("[BuildixGalleryTab] Response:", data.images?.length, "images, pagination:", data.pagination);

      if (data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("Failed to fetch Buildix gallery:", error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, color, aspectRatio]);

  // Initial fetch on mount - load all images
  useEffect(() => {
    fetchImages("all"); // "all" means no category filter = all images
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchImages(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, category, color, aspectRatio]);

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
