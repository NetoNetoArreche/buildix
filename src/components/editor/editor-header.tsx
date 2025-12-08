"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  MousePointer2,
  Code,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Download,
  Share2,
  Undo2,
  Redo2,
  Type,
  Palette,
  Image,
  Copy,
  FileDown,
  Check,
  Images,
  Loader2,
  Camera,
  Layers,
  LayoutGrid,
  Upload,
  FileUp,
  Figma,
} from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { injectBackgroundAssets } from "@/lib/background-assets";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { useUIStore } from "@/stores/uiStore";
import { useCommunityStore } from "@/stores/communityStore";
import { useCanvasModeStore } from "@/stores/canvasModeStore";
import { useProject } from "@/hooks/useProject";
import { generateThumbnail } from "@/lib/thumbnail";
import { cn } from "@/lib/utils";
import type { ViewMode, DeviceMode } from "@/types";

interface EditorHeaderProps {
  projectId: string;
  projectName?: string;
}

export function EditorHeader({ projectId, projectName }: EditorHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingThumbnail, setIsUpdatingThumbnail] = useState(false);
  const [thumbnailUpdated, setThumbnailUpdated] = useState(false);
  const { viewMode, setViewMode, deviceMode, setDeviceMode, zoom, setZoom, undo, redo, canUndo, canRedo, htmlContent, backgroundAssets, showLayersPanel, toggleLayersPanel, syncHtmlFromIframe } =
    useEditorStore();
  const { openModal } = useUIStore();
  const { openPublishModal } = useCommunityStore();
  const { updateProject } = useProject();
  const { isOpen: canvasModeOpen, toggleOpen: toggleCanvasMode } = useCanvasModeStore();

  // Get HTML with background assets injected
  const getExportHtml = () => {
    // Sync from iframe first if in design mode to get latest changes
    if (viewMode === "design") {
      syncHtmlFromIframe();
    }
    // Get the updated htmlContent from the store
    const currentHtml = useEditorStore.getState().htmlContent;
    return injectBackgroundAssets(currentHtml, backgroundAssets);
  };

  const handleCopyHTML = async () => {
    try {
      const exportHtml = getExportHtml();
      await navigator.clipboard.writeText(exportHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy HTML:", err);
    }
  };

  const handleDownloadHTML = () => {
    const exportHtml = getExportHtml();
    const blob = new Blob([exportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildix-export.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export single image (for post/story)
  const handleExportAsImage = async () => {
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) {
      console.error("Cannot access iframe content");
      return;
    }

    setIsExporting(true);
    try {
      // Get the first main container (the post/story div)
      const container = iframe.contentDocument.body.firstElementChild as HTMLElement;
      if (!container) {
        console.error("No content found to export");
        return;
      }

      // Use html-to-image to convert to PNG
      const dataUrl = await toPng(container, {
        width: container.offsetWidth,
        height: container.offsetHeight,
        pixelRatio: 2, // High resolution
        backgroundColor: "#000",
      });

      // Download the image
      const link = document.createElement("a");
      link.download = `${projectName || "buildix-export"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export carousel as ZIP with multiple images
  const handleExportCarouselAsZip = async () => {
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) {
      console.error("Cannot access iframe content");
      return;
    }

    // Find all carousel slides
    const slides = iframe.contentDocument.querySelectorAll(".carousel-slide");
    if (slides.length === 0) {
      // Fallback: try to find first child elements in body
      const bodyChildren = iframe.contentDocument.body.children;
      if (bodyChildren.length === 0) {
        console.error("No slides found to export");
        return;
      }
      // If no carousel-slide class, export single image instead
      await handleExportAsImage();
      return;
    }

    setIsExporting(true);
    try {
      const zip = new JSZip();

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;

        // Get the computed background color of the slide
        const iframeWindow = iframe.contentWindow;
        const computedStyle = iframeWindow?.getComputedStyle(slide);
        let bgColor = computedStyle?.backgroundColor || "#000";

        // If background is transparent or not set, check inline style or use default
        if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
          // Try to get from inline style
          bgColor = slide.style.backgroundColor || "#000";
        }

        const blob = await toBlob(slide, {
          width: 1080,
          height: 1350,
          pixelRatio: 2,
          backgroundColor: bgColor,
          // Ensure all styles are captured including Tailwind classes
          skipAutoScale: true,
          cacheBust: true,
        });
        if (blob) {
          zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${projectName || "instagram-carousel"}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Export carousel failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Update project thumbnail manually
  const handleUpdateThumbnail = async () => {
    if (projectId === "new") return;

    setIsUpdatingThumbnail(true);
    try {
      const thumbnail = await generateThumbnail();
      if (thumbnail) {
        await updateProject(projectId, { thumbnail });
        setThumbnailUpdated(true);
        setTimeout(() => setThumbnailUpdated(false), 2000);
      }
    } catch (error) {
      console.error("Failed to update thumbnail:", error);
    } finally {
      setIsUpdatingThumbnail(false);
    }
  };

  const viewModes: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
    { mode: "preview", icon: Eye, label: "Preview" },
    { mode: "design", icon: MousePointer2, label: "Design" },
    { mode: "code", icon: Code, label: "Code" },
  ];

  const deviceModes: { mode: DeviceMode; icon: React.ElementType; label: string; width: string }[] = [
    { mode: "desktop", icon: Monitor, label: "Desktop", width: "100%" },
    { mode: "tablet", icon: Tablet, label: "Tablet", width: "768px" },
    { mode: "mobile", icon: Smartphone, label: "Mobile", width: "375px" },
  ];

  return (
    <header className="flex h-12 items-center justify-between border-b bg-card px-2">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Back Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Projects</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6" />

        {/* Project Name Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 font-medium">
              {projectName || "Untitled Project"}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Project Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Pages Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              home
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>home</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="text-muted-foreground">+ Add Page</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={undo}
                disabled={!canUndo()}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (⌘Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={redo}
                disabled={!canRedo()}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Center Section - View Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
        {viewModes.map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === mode ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 gap-1.5 px-3",
                  viewMode === mode && "bg-background shadow-sm"
                )}
                onClick={() => {
                  // Sync HTML from iframe before switching away from design mode
                  // This ensures all DOM changes are saved to the store
                  if (viewMode === "design" && mode !== "design") {
                    syncHtmlFromIframe();
                  }
                  setViewMode(mode);
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Device Mode */}
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
          {deviceModes.map(({ mode, icon: Icon, label }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={deviceMode === mode ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDeviceMode(mode)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(zoom - 10)}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {zoom}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom(zoom + 10)}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Canvas Mode Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={canvasModeOpen ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1.5 px-2"
              onClick={toggleCanvasMode}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Canvas</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Canvas Mode - Screenshot & Mockup</TooltipContent>
        </Tooltip>

        {/* Layers Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showLayersPanel ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={toggleLayersPanel}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Layers (L)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Resource Buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openModal("fonts")}
            >
              <Type className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fonts</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openModal("colors")}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Colors</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openModal("backgroundAssets")}
            >
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Background Assets</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Export & Publish */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
            <DropdownMenuItem onClick={handleCopyHTML}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadHTML}>
              <FileDown className="mr-2 h-4 w-4" />
              Download HTML
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openModal("figmaExport")}>
              <FileUp className="mr-2 h-4 w-4 text-[#a259ff]" />
              Export to Figma
            </DropdownMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  disabled
                  className="opacity-50 cursor-not-allowed"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Upload className="mr-2 h-4 w-4 text-[#0acf83]/50" />
                  Import from Figma
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="left">
                Em breve disponivel
              </TooltipContent>
            </Tooltip>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportAsImage} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Export as PNG
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCarouselAsZip} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Images className="mr-2 h-4 w-4" />
                  Export Carousel (ZIP)
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleUpdateThumbnail}
              disabled={isUpdatingThumbnail || projectId === "new"}
            >
              {thumbnailUpdated ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Thumbnail Updated!
                </>
              ) : isUpdatingThumbnail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Update Thumbnail
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="buildix"
          size="sm"
          className="gap-1"
          onClick={() => projectId !== "new" && openPublishModal(projectId)}
          disabled={projectId === "new"}
        >
          <Share2 className="h-3.5 w-3.5" />
          Publish
        </Button>
      </div>
    </header>
  );
}
