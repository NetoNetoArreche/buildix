"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageGrid, ImageItem } from "../ImageGrid";
import { useDebounce } from "@/hooks/useDebounce";

interface PexelsTabProps {
  searchQuery: string;
  color: string | null;
  aspectRatio: string | null;
  onSelect: (url: string) => void;
}

export function PexelsTab({
  searchQuery,
  color,
  aspectRatio,
  onSelect,
}: PexelsTabProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedQuery = useDebounce(searchQuery, 500);

  const fetchImages = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        query: debouncedQuery || "background abstract",
        page: String(currentPage),
        per_page: "30",
      });

      if (color) {
        params.set("color", color);
      }

      if (aspectRatio && aspectRatio !== "all") {
        params.set("orientation", aspectRatio);
      }

      const response = await fetch(`/api/images/pexels?${params}`);
      const data = await response.json();

      if (data.images) {
        if (reset) {
          setImages(data.images);
          setPage(2);
        } else {
          setImages((prev) => [...prev, ...data.images]);
          setPage((p) => p + 1);
        }
        setHasMore(data.images.length === 30);
      }
    } catch (error) {
      console.error("Failed to fetch Pexels images:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, color, aspectRatio, page]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchImages(true);
  }, [debouncedQuery, color, aspectRatio]);

  const handleSelect = (image: ImageItem) => {
    setSelectedId(image.id);
    onSelect(image.url);
  };

  return (
    <div className="h-full flex flex-col">
      <ImageGrid
        images={images}
        isLoading={isLoading && images.length === 0}
        selectedId={selectedId}
        onSelect={handleSelect}
        emptyMessage="Search for images on Pexels"
      />
      {hasMore && images.length > 0 && (
        <button
          onClick={() => fetchImages(false)}
          disabled={isLoading}
          className="mt-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
