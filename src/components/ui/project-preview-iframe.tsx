"use client";

import { useRef, useEffect, useState, useMemo } from "react";

interface ProjectPreviewIframeProps {
  html: string;
  className?: string;
}

// Detect content type from HTML
function detectContentType(html: string): "landing" | "instagram-post" | "instagram-carousel" | "instagram-story" {
  if (!html) return "landing";

  if (html.includes("carousel-slide")) {
    return "instagram-carousel";
  }

  if (html.includes("w-[1080px]") && html.includes("h-[1080px]")) {
    return "instagram-post";
  }

  if (html.includes("w-[1080px]") && html.includes("h-[1920px]")) {
    return "instagram-story";
  }

  return "landing";
}

// Get dimensions based on content type
function getContentDimensions(contentType: string): { width: number; height: number } {
  switch (contentType) {
    case "instagram-post":
      return { width: 1080, height: 1080 };
    case "instagram-carousel":
      // Show just the first slide (1080x1350)
      return { width: 1080, height: 1350 };
    case "instagram-story":
      return { width: 1080, height: 1920 };
    default:
      // Landing page: viewport 16:9 para preview
      return { width: 1440, height: 810 };
  }
}

export function ProjectPreviewIframe({ html, className }: ProjectPreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  const contentType = useMemo(() => detectContentType(html), [html]);
  const dimensions = useMemo(() => getContentDimensions(contentType), [contentType]);
  const isInstagramContent = contentType !== "landing";

  // Calcular escala baseado no tamanho do container
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      const scaleX = containerWidth / dimensions.width;
      const scaleY = containerHeight / dimensions.height;

      // Para conteúdo Instagram (não-landing), usar "cover" (preencher container)
      // Para landing pages, usar "contain" (mostrar tudo)
      const newScale = isInstagramContent
        ? Math.max(scaleX, scaleY) // cover: preenche o container
        : Math.min(scaleX, scaleY, 1); // contain: mostra tudo

      setScale(newScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [dimensions, contentType]);

  // Process HTML for preview
  const processedHtml = useMemo(() => {
    let result = html;

    // Para carousels, mostrar apenas o primeiro slide
    if (contentType === "instagram-carousel") {
      const carouselStyles = `
        <style>
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          /* Hide all slides except the first one */
          .carousel-slide:not(:first-child) {
            display: none !important;
          }
          .carousel-slide:first-child {
            margin: 0 !important;
          }
        </style>
      `;
      if (result.includes("</head>")) {
        result = result.replace("</head>", `${carouselStyles}</head>`);
      } else {
        result = carouselStyles + result;
      }
    }

    // Para landing pages, limitar altura visível
    if (contentType === "landing") {
      const landingStyles = `
        <style>
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        </style>
      `;
      if (result.includes("</head>")) {
        result = result.replace("</head>", `${landingStyles}</head>`);
      } else {
        result = landingStyles + result;
      }
    }

    return result;
  }, [html, contentType]);

  // Injetar HTML no iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const writeToIframe = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(processedHtml);
      doc.close();
    };

    if (iframe.contentDocument) {
      writeToIframe();
    } else {
      iframe.addEventListener("load", writeToIframe);
      return () => iframe.removeEventListener("load", writeToIframe);
    }
  }, [processedHtml]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: "hidden",
        display: "flex",
        // Instagram: alinhar ao topo; Landing: centralizar
        alignItems: isInstagramContent ? "flex-start" : "center",
        justifyContent: "center",
      }}
    >
      <iframe
        ref={iframeRef}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: `scale(${scale})`,
          // Instagram: escalar do topo; Landing: escalar do centro
          transformOrigin: isInstagramContent ? "top center" : "center center",
          pointerEvents: "none",
          border: "none",
          flexShrink: 0,
        }}
        title="Project Preview"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}
