"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useEditorStore } from "@/stores/editorStore";
import {
  useCanvasModeStore,
  shadowStyles,
  brightnessStyles,
  devicePresets,
  type FrameConfig,
  type ShadowType,
  type BrightnessType,
} from "@/stores/canvasModeStore";
import { cn } from "@/lib/utils";
import { CanvasFrame, type AddContentAfterEvent } from "./canvas-frame";
import { CodeEditor } from "./code-editor";
import { injectBackgroundAssets } from "@/lib/background-assets";
import { FrameHeader } from "../canvas-mode/FrameHeader";

import type { ContentType } from "@/lib/constants/instagram-dimensions";

// Detect content type from HTML
function detectContentType(html: string): ContentType {
  if (!html) return "landing";

  // Check for mobile app screens
  if (html.includes("app-screen")) {
    return "mobile-app";
  }

  // Check for dashboard container
  if (html.includes("dashboard-container")) {
    return "dashboard";
  }

  // Check for email template container
  if (html.includes("email-container")) {
    return "email-template";
  }

  // Check for carousel slides
  if (html.includes("carousel-slide")) {
    return "instagram-carousel";
  }

  // Check for Instagram post dimensions (1080x1080)
  if (html.includes("w-[1080px]") && html.includes("h-[1080px]")) {
    return "instagram-post";
  }

  // Check for Instagram story dimensions (1080x1920)
  if (html.includes("w-[1080px]") && html.includes("h-[1920px]")) {
    return "instagram-story";
  }

  return "landing";
}

// Default HTML template for new projects
const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-50">
  <!-- Hero Section -->
  <section class="min-h-screen flex flex-col items-center justify-center px-6 py-24">
    <div class="max-w-4xl mx-auto text-center">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-4 py-1.5 rounded-full text-sm mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
        </svg>
        Powered by AI
      </div>

      <!-- Main Heading -->
      <h1 id="hero-title" class="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
        The Art of Perfect Coffee
      </h1>

      <!-- Subheading -->
      <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        We approach coffee as a science and an art. Sourced ethically, roasted meticulously, and brewed with mathematical precision.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button class="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-colors">
          Get Started
        </button>
        <button class="px-8 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium rounded-full transition-colors">
          Learn More
        </button>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="py-24 px-6 border-t border-zinc-800">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-16">Why Choose Us</h2>

      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Lightning Fast</h3>
          <p class="text-zinc-400">Generate stunning designs in seconds with our AI-powered platform.</p>
        </div>

        <!-- Feature 2 -->
        <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Fully Customizable</h3>
          <p class="text-zinc-400">Edit every element with our visual editor or dive into the code.</p>
        </div>

        <!-- Feature 3 -->
        <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">One-Click Export</h3>
          <p class="text-zinc-400">Download clean HTML or publish directly to your subdomain.</p>
        </div>
      </div>
    </div>
  </section>
</body>
</html>`;

export function Canvas() {
  const {
    viewMode,
    zoom,
    deviceMode,
    htmlContent,
    setHtmlContent,
    selectElement,
    setSelectedElementData,
    selectedElementId,
    streamingHtml,
    isStreaming,
    streamingContentType,
    setInsertAfterMode,
    backgroundAssets,
    deleteSelectedElement,
  } = useEditorStore();

  // Early return for code mode - must be after ALL hooks
  // We'll use conditional rendering instead at the end of the component

  // Canvas Mode state
  const {
    isOpen: canvasModeOpen,
    isFullscreen,
    backgroundColor,
    borderColor,
    cornerRadius,
    ringWidth,
    shadow,
    brightness,
    zoom: canvasModeZoom,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    frames,
    backgroundType,
    backgroundValue,
    backgroundAsset,
    overlayImage,
    overlayAsset,
    panX,
    panY,
    setPan,
    updateFrame,
  } = useCanvasModeStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [autoScale, setAutoScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Pan state (Space + Drag) - using refs for smooth performance
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const currentPanRef = useRef({ x: panX, y: panY });
  const rafIdRef = useRef<number | null>(null);

  // Sync ref with store state when not panning
  useEffect(() => {
    if (!isPanning) {
      currentPanRef.current = { x: panX, y: panY };
    }
  }, [panX, panY, isPanning]);

  // Handle Space key for pan mode
  useEffect(() => {
    if (!canvasModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canvasModeOpen]);

  // Handle mouse events for panning - optimized with RAF
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isSpacePressed && canvasModeOpen) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - currentPanRef.current.x, y: e.clientY - currentPanRef.current.y };
    }
  }, [isSpacePressed, canvasModeOpen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && canvasModeOpen) {
      e.preventDefault();
      const newPanX = e.clientX - panStartRef.current.x;
      const newPanY = e.clientY - panStartRef.current.y;

      // Update ref immediately for smooth visual
      currentPanRef.current = { x: newPanX, y: newPanY };

      // Cancel previous RAF and schedule new one
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        setPan(newPanX, newPanY);
      });
    }
  }, [isPanning, canvasModeOpen, setPan]);

  const handleMouseUp = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsPanning(false);
  }, []);

  // Handler for add content after action - activates insertion mode in the store
  const handleAddContentAfter = useCallback((event: AddContentAfterEvent) => {
    setInsertAfterMode(true, event.elementId, event.elementHtml);
  }, [setInsertAfterMode]);

  // Handler for element selection - memoized to prevent iframe reloads
  const handleElementSelect = useCallback((id: string | null, data?: import("@/stores/editorStore").SelectedElementData) => {
    selectElement(id);
    if (data) {
      setSelectedElementData(data);
    }
  }, [selectElement, setSelectedElementData]);

  // Determine which HTML to display: streaming content during generation, otherwise final content
  const baseHtml = isStreaming && streamingHtml ? streamingHtml : htmlContent;

  // Inject background assets into the HTML (memoized to prevent unnecessary recalculations)
  const displayHtml = useMemo(() => {
    if (!baseHtml) return baseHtml;
    return injectBackgroundAssets(baseHtml, backgroundAssets);
  }, [baseHtml, backgroundAssets]);

  // Detect content type
  // During streaming, use the stored streamingContentType to avoid layout jumps
  // (HTML is incomplete during streaming, so detectContentType may return wrong type)
  const detectedContentType = detectContentType(displayHtml);
  const contentType = isStreaming && streamingContentType ? streamingContentType : detectedContentType;
  const isInstagramContent = contentType !== "landing";

  // Initialize with generated HTML from sessionStorage or default HTML
  useEffect(() => {
    if (!htmlContent) {
      // Check if there's generated HTML in sessionStorage
      const generatedHtml = sessionStorage.getItem("buildix-generated-html");
      if (generatedHtml) {
        setHtmlContent(generatedHtml);
        // Clear sessionStorage after loading
        sessionStorage.removeItem("buildix-generated-html");
      } else {
        setHtmlContent(defaultHtml);
      }
    }
  }, [htmlContent, setHtmlContent]);

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate auto-scale for Instagram content
  useEffect(() => {
    if (!isInstagramContent || containerSize.width === 0) {
      setAutoScale(1);
      return;
    }

    // Content dimensions based on type
    // For carousel/mobile-app, include the body padding (p-8 = 32px top + bottom = 64px extra)
    const contentDimensions: Record<string, { width: number; height: number }> = {
      "instagram-post": { width: 1080, height: 1080 },
      "instagram-carousel": { width: 1080, height: 1350 + 64 }, // Slide + body padding
      "instagram-story": { width: 1080, height: 1920 },
      "mobile-app": { width: 390, height: 844 + 64 }, // Screen + body padding
      "dashboard": { width: 1440, height: 900 },
      "email-template": { width: 600, height: 800 + 80 }, // Email + body padding
    };

    const dims = contentDimensions[contentType] || { width: 1080, height: 1080 };

    // Calculate scale to fit container - use almost all available height
    const padding = 16; // Small padding for breathing room
    const availableHeight = containerSize.height - padding;

    // Scale based on height to fit vertically - user can scroll horizontally for carousel
    const scaleY = availableHeight / dims.height;

    // Use height-based scale, capped at 1 (never scale up)
    const scale = Math.min(scaleY, 1);

    setAutoScale(Math.max(0.15, scale)); // Minimum 15% scale
  }, [contentType, isInstagramContent, containerSize]);

  // Device dimensions for normal editor mode
  const deviceDimensions = {
    desktop: { width: "100%", maxWidth: "none" },
    tablet: { width: "768px", maxWidth: "768px" },
    mobile: { width: "375px", maxWidth: "375px" },
  };

  const dimensions = deviceDimensions[deviceMode];

  // Calculate final scale (combine zoom and auto-scale for Instagram)
  // Use canvas mode zoom when panel is open, otherwise use editor zoom
  const effectiveZoom = canvasModeOpen ? canvasModeZoom : zoom;
  const finalScale = isInstagramContent ? autoScale * (effectiveZoom / 100) : effectiveZoom / 100;

  // For carousel/mobile-app, we need left alignment for horizontal scroll
  // For post/story/dashboard, we can center horizontally
  const isCarousel = contentType === "instagram-carousel" || contentType === "mobile-app";

  // Canvas Mode 3D transform styles (only for non-canvas mode)
  const normalModeTransform = `scale(${finalScale})`;

  // Canvas Mode background style
  const getCanvasBackground = () => {
    if (!canvasModeOpen) {
      return {
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
        backgroundSize: "24px 24px",
      };
    }

    // For image type, we render a separate <img> element to support filters
    if (backgroundType === "image" && backgroundValue) {
      return { backgroundColor };
    }

    if (backgroundType === "video") {
      // Video background is handled separately
      return { backgroundColor };
    }

    // Default embed/solid color
    return { backgroundColor };
  };

  // Build filter style for background asset
  const getAssetFilterStyle = (asset: typeof backgroundAsset) => {
    if (!asset) return {};

    const filters = [];
    if (asset.hue && asset.hue !== 0) filters.push(`hue-rotate(${asset.hue}deg)`);
    if (asset.saturation && asset.saturation !== 100) filters.push(`saturate(${asset.saturation}%)`);
    if (asset.brightness && asset.brightness !== 100) filters.push(`brightness(${asset.brightness}%)`);
    if (asset.blur && asset.blur > 0) filters.push(`blur(${asset.blur}px)`);
    if (asset.invert) filters.push(`invert(100%)`);

    return {
      filter: filters.length > 0 ? filters.join(" ") : undefined,
      opacity: asset.opacity !== undefined ? asset.opacity / 100 : 1,
      mixBlendMode: asset.blendMode || "normal",
    } as React.CSSProperties;
  };

  // Create srcDoc for canvas mode iframes
  const createSrcDoc = (html: string) => {
    if (html.includes('<!DOCTYPE') || html.includes('<html')) {
      return html;
    }
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
  };

  // Handle device preset change
  const handlePresetChange = useCallback((index: number, presetId: string) => {
    const preset = devicePresets.find((p) => p.id === presetId);
    if (preset) {
      updateFrame(index, {
        device: preset.device,
        width: preset.width,
        height: preset.height,
      });
    }
  }, [updateFrame]);

  // Handle iframe refresh
  const handleRefresh = useCallback((index: number) => {
    const iframe = iframeRefs.current[index];
    if (iframe) {
      // Force reload by updating srcDoc
      const srcDoc = iframe.srcdoc;
      iframe.srcdoc = "";
      setTimeout(() => {
        iframe.srcdoc = srcDoc;
      }, 0);
    }
  }, []);

  // Frame drag state
  const [draggingFrameIndex, setDraggingFrameIndex] = useState<number | null>(null);
  const frameDragStartRef = useRef({ x: 0, y: 0 });
  const frameDragOffsetRef = useRef({ x: 0, y: 0 });
  const frameRafIdRef = useRef<number | null>(null);

  // Handle frame drag start
  const handleFrameDragStart = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFrameIndex(index);

    const frame = frames[index];
    frameDragStartRef.current = { x: e.clientX, y: e.clientY };
    frameDragOffsetRef.current = { x: frame.offsetX || 0, y: frame.offsetY || 0 };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - frameDragStartRef.current.x;
      const deltaY = moveEvent.clientY - frameDragStartRef.current.y;
      const newOffsetX = frameDragOffsetRef.current.x + deltaX;
      const newOffsetY = frameDragOffsetRef.current.y + deltaY;

      // Cancel previous RAF and schedule new one
      if (frameRafIdRef.current) {
        cancelAnimationFrame(frameRafIdRef.current);
      }

      frameRafIdRef.current = requestAnimationFrame(() => {
        updateFrame(index, { offsetX: newOffsetX, offsetY: newOffsetY });
      });
    };

    const handleMouseUp = () => {
      if (frameRafIdRef.current) {
        cancelAnimationFrame(frameRafIdRef.current);
        frameRafIdRef.current = null;
      }
      setDraggingFrameIndex(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [frames, updateFrame]);

  // Render a single frame for Canvas Mode
  const renderCanvasModeFrame = (frame: FrameConfig, index: number) => {
    const scaledWidth = frame.width * (canvasModeZoom / 100);
    const scaledHeight = frame.height * (canvasModeZoom / 100);
    const isDraggingThisFrame = draggingFrameIndex === index;

    return (
      <div
        key={index}
        className={cn(
          "relative flex-shrink-0 flex flex-col group",
          isDraggingThisFrame && "z-50"
        )}
        style={{
          transform: `translate(${frame.offsetX || 0}px, ${frame.offsetY || 0}px)`,
        }}
      >
        {/* Frame Header - only visible on hover or when dragging */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isDraggingThisFrame && "opacity-100"
        )}>
          <FrameHeader
            index={index}
            frame={frame}
            cornerRadius={0}
            onPresetChange={(presetId) => handlePresetChange(index, presetId)}
            onDimensionChange={(w, h) => updateFrame(index, { width: w, height: h })}
            onRefresh={() => handleRefresh(index)}
            onDragStart={(e) => handleFrameDragStart(index, e)}
            isDragging={isDraggingThisFrame}
          />
        </div>

        {/* Frame container with styling */}
        <div
          className={cn(
            "relative overflow-hidden transition-shadow",
            isDraggingThisFrame && "ring-2 ring-violet-500 ring-offset-2 ring-offset-transparent"
          )}
          style={{
            width: scaledWidth,
            height: scaledHeight,
            borderRadius: `${cornerRadius}px`,
            boxShadow: isDraggingThisFrame ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : shadowStyles[shadow as ShadowType],
            filter: brightnessStyles[brightness as BrightnessType] !== "none" ? brightnessStyles[brightness as BrightnessType] : undefined,
          }}
        >
          {/* Iframe with scaled content - ALWAYS INTERACTIVE */}
          <iframe
            ref={(el) => { iframeRefs.current[index] = el; }}
            srcDoc={createSrcDoc(displayHtml)}
            title={`Preview - ${frame.device} ${index + 1}`}
            className="border-none"
            style={{
              width: frame.width,
              height: frame.height,
              transform: `scale(${canvasModeZoom / 100})`,
              transformOrigin: "top left",
            }}
            sandbox="allow-scripts allow-same-origin"
          />
          {/* Ring overlay - rendered on top of iframe */}
          {ringWidth > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: `${cornerRadius}px`,
                boxShadow: `inset 0 0 0 ${ringWidth}px ${borderColor}`,
              }}
            />
          )}
        </div>
      </div>
    );
  };

  // Render the canvas frame content for normal editor mode
  const renderCanvasFrame = (isMobileVersion = false) => (
    <div
      className={cn(
        "relative transition-all duration-300",
        !canvasModeOpen && deviceMode === "desktop" && !isInstagramContent && "bg-white shadow-2xl",
        !canvasModeOpen && deviceMode === "tablet" && !isInstagramContent && "bg-zinc-800 rounded-[2rem] p-3 shadow-2xl",
        !canvasModeOpen && deviceMode === "mobile" && !isInstagramContent && "bg-zinc-900 rounded-[3rem] p-2 shadow-2xl",
        !canvasModeOpen && isInstagramContent && "rounded-none bg-transparent shadow-none"
      )}
      style={{
        width: isInstagramContent ? "auto" : (deviceMode === "mobile" || isMobileVersion ? "auto" : dimensions.width),
        maxWidth: isInstagramContent ? "none" : dimensions.maxWidth,
        height: isInstagramContent ? "auto" : (deviceMode === "desktop" && !isMobileVersion ? "100%" : "auto"),
        transform: normalModeTransform,
        transformOrigin: isCarousel ? "top left" : "center center",
      }}
    >
      {/* Mobile Phone Frame */}
      {(deviceMode === "mobile" || isMobileVersion) && !isInstagramContent && !canvasModeOpen && (
        <>
          {/* Notch / Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
            <div className="h-[28px] w-[100px] bg-zinc-950 rounded-full flex items-center justify-center gap-2">
              {/* Camera */}
              <div className="h-3 w-3 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
              {/* Speaker */}
              <div className="h-1 w-10 bg-zinc-800 rounded-full" />
            </div>
          </div>
          {/* Side buttons - Volume */}
          <div className="absolute -left-[3px] top-28 w-[3px] h-8 bg-zinc-700 rounded-l-sm" />
          <div className="absolute -left-[3px] top-40 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
          <div className="absolute -left-[3px] top-56 w-[3px] h-12 bg-zinc-700 rounded-l-sm" />
          {/* Side button - Power */}
          <div className="absolute -right-[3px] top-36 w-[3px] h-16 bg-zinc-700 rounded-r-sm" />
        </>
      )}

      {/* Tablet Frame */}
      {deviceMode === "tablet" && !isInstagramContent && !canvasModeOpen && (
        <>
          {/* Camera */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10">
            <div className="h-2 w-2 rounded-full bg-zinc-600" />
          </div>
        </>
      )}

      {/* Inner screen container for mobile/tablet */}
      <div
        className={cn(
          "relative overflow-hidden",
          !canvasModeOpen && (deviceMode === "mobile" || isMobileVersion) && !isInstagramContent && "rounded-[2.5rem] bg-white",
          !canvasModeOpen && deviceMode === "tablet" && !isInstagramContent && "rounded-xl bg-white",
        )}
        style={{
          width: (deviceMode === "mobile" || isMobileVersion) && !isInstagramContent ? "375px" : "100%",
          height: (deviceMode === "mobile" || isMobileVersion) && !isInstagramContent ? "812px" : (deviceMode === "tablet" ? "auto" : "100%"),
        }}
      >
        {/* Iframe Preview */}
        <CanvasFrame
          html={displayHtml}
          isDesignMode={viewMode === "design" && !isStreaming}
          onElementSelect={handleElementSelect}
          selectedElementId={isStreaming ? null : selectedElementId}
          contentType={contentType}
          isStreaming={isStreaming}
          deviceMode={isMobileVersion ? "mobile" : deviceMode}
          onAddContentAfter={handleAddContentAfter}
          onDeleteElement={deleteSelectedElement}
        />
      </div>
    </div>
  );

  // Calculate 3D transform for canvas mode
  const canvasMode3DTransform = perspective > 0
    ? `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;

  // Prepare canvas settings for screenshot capture
  const canvasSettingsForCapture = canvasModeOpen ? JSON.stringify({
    cornerRadius,
    shadow,
    brightness,
    backgroundAsset: backgroundAsset || null,
  }) : undefined;

  const canvasContent = (
    <div
      ref={containerRef}
      data-canvas-wrapper={canvasModeOpen ? "true" : undefined}
      data-canvas-settings={canvasSettingsForCapture}
      className={cn(
        "relative flex h-full overflow-auto",
        canvasModeOpen
          ? "items-center justify-center overflow-hidden"
          : cn(
              "bg-zinc-900/50",
              isInstagramContent
                ? isCarousel
                  ? "items-start justify-start p-4"
                  : "items-center justify-center p-4"
                : "items-center justify-center p-8"
            ),
        isFullscreen && "fixed inset-0 z-50",
        isSpacePressed && canvasModeOpen && "cursor-grab",
        isPanning && canvasModeOpen && "cursor-grabbing"
      )}
      style={getCanvasBackground()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Background for Canvas Mode */}
      {canvasModeOpen && backgroundType === "video" && backgroundValue && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={backgroundValue}
        />
      )}

      {/* Image Background for Canvas Mode - with filter effects */}
      {canvasModeOpen && backgroundType === "image" && backgroundValue && (
        <img
          src={backgroundValue}
          alt="Canvas background"
          className="absolute inset-0 w-full h-full object-cover"
          style={getAssetFilterStyle(backgroundAsset)}
        />
      )}

      {/* Canvas Mode - Multiple Frames */}
      {canvasModeOpen ? (
        <div
          data-canvas-container
          className="relative flex items-center justify-center gap-8"
          style={{
            transform: `translate(${panX}px, ${panY}px) ${canvasMode3DTransform}`,
            transformOrigin: "center center",
          }}
        >
          {frames.map((frame: FrameConfig, index: number) => renderCanvasModeFrame(frame, index))}
        </div>
      ) : (
        // Normal Editor Mode
        renderCanvasFrame(false)
      )}

      {/* Overlay Image - with filter effects */}
      {canvasModeOpen && overlayImage && (
        <img
          src={overlayImage}
          alt="Canvas overlay"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{
            zIndex: 10,
            ...getAssetFilterStyle(overlayAsset),
          }}
        />
      )}
    </div>
  );

  // Use conditional rendering instead of early return to avoid breaking hooks
  if (viewMode === "code") {
    return <CodeEditor />;
  }

  return canvasContent;
}
