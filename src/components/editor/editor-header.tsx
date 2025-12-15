"use client";

import { useState, useEffect } from "react";
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
  Home,
  Plus,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { toPng, toBlob, getFontEmbedCSS } from "html-to-image";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { ViewMode, DeviceMode, Page } from "@/types";
import type { Page as PrismaPage } from "@prisma/client";

interface EditorHeaderProps {
  projectId: string;
  projectName?: string;
  pages?: PrismaPage[];
}

export function EditorHeader({ projectId, projectName, pages: initialPages }: EditorHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingThumbnail, setIsUpdatingThumbnail] = useState(false);
  const [thumbnailUpdated, setThumbnailUpdated] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ pageId: string; pageName: string } | null>(null);
  const [localPages, setLocalPages] = useState<PrismaPage[]>(initialPages || []);
  const { viewMode, setViewMode, deviceMode, setDeviceMode, zoom, setZoom, undo, redo, canUndo, canRedo, htmlContent, backgroundAssets, showLayersPanel, toggleLayersPanel, syncHtmlFromIframe, currentPage, setCurrentPage } =
    useEditorStore();
  const { openModal } = useUIStore();
  const { openPublishModal } = useCommunityStore();
  const { updateProject, deletePage } = useProject();
  const { isOpen: canvasModeOpen, toggleOpen: toggleCanvasMode } = useCanvasModeStore();
  const [isDeletingPage, setIsDeletingPage] = useState<string | null>(null);

  // Sync local pages when initialPages changes (e.g., on initial load)
  useEffect(() => {
    if (initialPages) {
      setLocalPages(initialPages);
    }
  }, [initialPages]);

  // Use local pages state for real-time updates
  const pages = localPages;

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

  const handleDownloadHTML = async () => {
    setIsDownloading(true);
    setExportError(null);

    try {
      // Check and increment usage limit via API
      const response = await fetch("/api/exports/html", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.usageLimit) {
          setExportError(data.error);
          return;
        }
        throw new Error(data.error || "Failed to export");
      }

      // If limit check passed, proceed with download
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
    } catch (err) {
      console.error("Failed to download HTML:", err);
      setExportError("Erro ao exportar. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
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

      const iframeWindow = iframe.contentWindow;

      // Aguardar carregamento de todas as fontes no iframe
      if (iframeWindow?.document?.fonts) {
        await iframeWindow.document.fonts.ready;
      }

      // Pré-computar CSS das fontes embarcadas
      let fontEmbedCSS: string | undefined;
      try {
        fontEmbedCSS = await getFontEmbedCSS(container);
      } catch (fontError) {
        console.warn("Não foi possível embarcar fontes:", fontError);
      }

      // Use html-to-image to convert to PNG
      const dataUrl = await toPng(container, {
        width: container.offsetWidth,
        height: container.offsetHeight,
        pixelRatio: 2, // High resolution
        backgroundColor: "#000",
        // Fontes embarcadas como base64 para garantir renderização correta
        fontEmbedCSS,
        preferredFontFormat: "woff2",
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
      setExportError("Nao foi possivel acessar o conteudo do iframe.");
      return;
    }

    // Find all carousel slides
    const slides = iframe.contentDocument.querySelectorAll(".carousel-slide");
    if (slides.length === 0) {
      // Fallback: try to find first child elements in body
      const bodyChildren = iframe.contentDocument.body.children;
      if (bodyChildren.length === 0) {
        console.error("No slides found to export");
        setExportError("Nenhum slide encontrado para exportar.");
        return;
      }
      // If no carousel-slide class, export single image instead
      await handleExportAsImage();
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const zip = new JSZip();
      let failedSlides = 0;
      const iframeWindow = iframe.contentWindow;

      // 1. Aguardar carregamento de todas as fontes no iframe
      if (iframeWindow?.document?.fonts) {
        await iframeWindow.document.fonts.ready;
      }

      // 2. Pré-computar CSS das fontes embarcadas (uma vez para todos os slides)
      const firstSlide = slides[0] as HTMLElement;
      let fontEmbedCSS: string | undefined;
      try {
        fontEmbedCSS = await getFontEmbedCSS(firstSlide);
      } catch (fontError) {
        console.warn("Não foi possível embarcar fontes:", fontError);
      }

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;

        // Get the computed background color of the slide
        const computedStyle = iframeWindow?.getComputedStyle(slide);
        let bgColor = computedStyle?.backgroundColor || "#000";

        // If background is transparent or not set, check inline style or use default
        if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
          // Try to get from inline style
          bgColor = slide.style.backgroundColor || "#000";
        }

        try {
          const blob = await toBlob(slide, {
            width: 1080,
            height: 1350,
            pixelRatio: 2,
            backgroundColor: bgColor,
            // Ensure all styles are captured including Tailwind classes
            skipAutoScale: true,
            cacheBust: true,
            // Fontes embarcadas como base64 para garantir renderização correta
            fontEmbedCSS,
            preferredFontFormat: "woff2",
            // Handle failed images gracefully
            filter: (node) => {
              // Skip broken images to prevent export failure
              if (node instanceof HTMLImageElement && !node.complete) {
                return false;
              }
              return true;
            },
          });
          if (blob) {
            zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
          } else {
            failedSlides++;
            console.warn(`Slide ${i + 1} gerou blob vazio`);
          }
        } catch (slideError) {
          failedSlides++;
          console.warn(`Falha ao exportar slide ${i + 1}:`, slideError);
          // Continue with other slides even if one fails
        }
      }

      // Check if any slides were exported
      const exportedCount = slides.length - failedSlides;
      if (exportedCount === 0) {
        setExportError("Nenhum slide foi exportado. Verifique se as imagens carregaram corretamente.");
        return;
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${projectName || "instagram-carousel"}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);

      // Show warning if some slides failed
      if (failedSlides > 0) {
        setExportError(`Aviso: ${failedSlides} slide(s) nao foram exportados devido a imagens com erro.`);
      }
    } catch (error) {
      console.error("Export carousel failed:", error);
      setExportError("Erro ao exportar carousel. Verifique se todas as imagens carregaram.");
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

  // Handle page deletion - show confirmation modal
  const handleDeletePageClick = (pageId: string, pageName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown item click
    setShowDeleteConfirm({ pageId, pageName });
  };

  // Confirm page deletion
  const confirmDeletePage = async () => {
    if (!showDeleteConfirm) return;

    const { pageId } = showDeleteConfirm;
    setIsDeletingPage(pageId);
    setShowDeleteConfirm(null);

    try {
      const success = await deletePage(projectId, pageId);
      if (success) {
        // Update local pages state immediately for real-time UI update
        setLocalPages(prev => prev.filter(p => p.id !== pageId));

        // If we deleted the current page, switch to first available page
        if (currentPage?.id === pageId && pages && pages.length > 1) {
          const nextPage = pages.find(p => p.id !== pageId);
          if (nextPage) {
            setCurrentPage({ ...nextPage, order: 0, cssContent: nextPage.cssContent || undefined } as Page);
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete page:", error);
    } finally {
      setIsDeletingPage(null);
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
              {currentPage?.name || "home"}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            {pages?.map((page) => (
              <DropdownMenuItem
                key={page.id}
                onClick={() => setCurrentPage({ ...page, order: 0, cssContent: page.cssContent || undefined } as Page)}
                className={cn(
                  "flex items-center justify-between group",
                  currentPage?.id === page.id && "bg-accent"
                )}
              >
                <div className="flex items-center">
                  {page.isHome && <Home className="h-3 w-3 mr-2" />}
                  {page.name}
                </div>
                <div className="flex items-center gap-1">
                  {currentPage?.id === page.id && (
                    <Check className="h-3 w-3" />
                  )}
                  {/* Delete button - only show if not the last page */}
                  {pages && pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => handleDeletePageClick(page.id, page.name, e)}
                      disabled={isDeletingPage === page.id}
                    >
                      {isDeletingPage === page.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {pages && pages.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem>
              <Plus className="h-3 w-3 mr-2" />
              <span className="text-muted-foreground">Add Page</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal("pageTransitions")}>
              <ArrowRightLeft className="h-3 w-3 mr-2" />
              <span className="text-muted-foreground">Page Transitions</span>
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
        {viewModes.map(({ mode, icon: Icon, label }) => {
          // Disable Design mode when Canvas Mode is active
          const isDisabled = mode === "design" && canvasModeOpen;
          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === mode ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-7 gap-1.5 px-3",
                    viewMode === mode && "bg-background shadow-sm",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
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
              <TooltipContent>
                {isDisabled ? "Design mode not available in Canvas Mode" : label}
              </TooltipContent>
            </Tooltip>
          );
        })}
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
              onClick={() => {
                // If enabling Canvas Mode while in Design mode, switch to Preview first
                if (!canvasModeOpen && viewMode === "design") {
                  syncHtmlFromIframe();
                  setViewMode("preview");
                }
                toggleCanvasMode();
              }}
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
            <DropdownMenuItem onClick={handleDownloadHTML} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download HTML
                </>
              )}
            </DropdownMenuItem>
            {exportError && (
              <div className="px-2 py-1.5 text-xs text-destructive">
                {exportError}
              </div>
            )}
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

      {/* Delete Page Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Deletar Página
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a página <strong>&quot;{showDeleteConfirm?.pageName}&quot;</strong>?
              <br />
              <span className="text-destructive">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
