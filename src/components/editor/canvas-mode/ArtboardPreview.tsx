"use client";

import { useMemo } from "react";
import { type Artboard, useArtboardsStore } from "@/stores/artboardsStore";
import { useCanvasModeStore, shadowStyles, brightnessStyles } from "@/stores/canvasModeStore";
import { ArtboardHeader } from "./ArtboardHeader";
import { cn } from "@/lib/utils";

interface ArtboardPreviewProps {
  artboard: Artboard;
  html: string;
  isSelected: boolean;
}

export function ArtboardPreview({ artboard, html, isSelected }: ArtboardPreviewProps) {
  const { selectArtboard } = useArtboardsStore();
  const {
    cornerRadius,
    ringWidth,
    borderColor,
    shadow,
    brightness,
  } = useCanvasModeStore();

  // Create srcDoc with the HTML content
  const srcDoc = useMemo(() => {
    // Extract body content if full HTML document
    if (html.includes('<!DOCTYPE') || html.includes('<html')) {
      return html;
    }
    // Wrap partial HTML in a basic document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }, [html]);

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        isSelected && "ring-2 ring-violet-500/50"
      )}
      style={{
        width: artboard.width * artboard.scale,
        height: artboard.height * artboard.scale,
        transform: `translate(${artboard.position.x}px, ${artboard.position.y}px)`,
      }}
    >
      {/* Artboard Header */}
      <ArtboardHeader
        artboard={artboard}
        isSelected={isSelected}
        onSelect={() => selectArtboard(artboard.id)}
      />

      {/* Preview Frame */}
      <div
        className="relative w-full h-full overflow-hidden bg-white"
        style={{
          borderRadius: `${cornerRadius}px`,
          border: ringWidth > 0 ? `${ringWidth}px solid ${borderColor}` : undefined,
          boxShadow: shadowStyles[shadow],
          filter: brightnessStyles[brightness] !== "none" ? brightnessStyles[brightness] : undefined,
        }}
        onClick={() => selectArtboard(artboard.id)}
      >
        {/* Iframe with scaled content */}
        <iframe
          srcDoc={srcDoc}
          title={`Preview - ${artboard.name}`}
          className="w-full h-full border-none pointer-events-none"
          style={{
            width: artboard.width,
            height: artboard.height,
            transform: `scale(${artboard.scale})`,
            transformOrigin: "top left",
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-violet-500 pointer-events-none rounded-inherit"
          style={{ borderRadius: `${cornerRadius}px` }}
        />
      )}
    </div>
  );
}
