"use client";

import { useRef, useEffect, useState } from "react";

interface ComponentPreviewIframeProps {
  code: string;
  className?: string;
  /** When true, iframe takes full width without scaling (for modal preview) */
  fullWidth?: boolean;
}

export function ComponentPreviewIframe({ code, className, fullWidth = false }: ComponentPreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [iframeHeight, setIframeHeight] = useState(600);

  // Component preview dimensions (simulating a desktop viewport)
  // Height is larger to ensure it fills aspect-[4/3] containers after scaling
  const dimensions = { width: 1200, height: 1200 };

  // Calculate scale based on container size (only for thumbnail mode)
  useEffect(() => {
    if (fullWidth || !containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      // Scale to fill width, let height overflow (will be clipped)
      const newScale = containerWidth / dimensions.width;
      setScale(newScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [fullWidth]);

  // Inject HTML into iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const writeToIframe = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Wrap component code in full HTML document with Tailwind
      const fullHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: white;
      }
    </style>
  </head>
  <body>
    ${code}
  </body>
</html>
      `;

      doc.open();
      doc.write(fullHtml);
      doc.close();

      // For fullWidth mode, adjust iframe height to match content
      if (fullWidth) {
        // Wait for Tailwind to load and render
        setTimeout(() => {
          try {
            const body = doc.body;
            const html = doc.documentElement;
            if (body && html) {
              const contentHeight = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.scrollHeight,
                html.offsetHeight
              );
              setIframeHeight(contentHeight + 50); // Add some padding
            }
          } catch (e) {
            console.error("Error getting iframe height:", e);
          }
        }, 500);
      }
    };

    if (iframe.contentDocument) {
      writeToIframe();
    } else {
      iframe.addEventListener("load", writeToIframe);
      return () => iframe.removeEventListener("load", writeToIframe);
    }
  }, [code, fullWidth]);

  // Full width mode - iframe fills container without scaling
  if (fullWidth) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          overflow: "auto",
        }}
      >
        <iframe
          ref={iframeRef}
          style={{
            width: "100%",
            height: `${iframeHeight}px`,
            border: "none",
            display: "block",
          }}
          title="Component Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    );
  }

  // Thumbnail mode - scaled down preview
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
      }}
    >
      <iframe
        ref={iframeRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          border: "none",
        }}
        title="Component Preview"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
