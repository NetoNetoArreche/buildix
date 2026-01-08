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
  Play,
} from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import JSZip from "jszip";

// Helper function to fetch Google Font CSS and convert fonts to base64
async function fetchGoogleFontsAsBase64(fontNames: string[]): Promise<string> {
  const fontCSS: string[] = [];
  console.log("[fetchGoogleFontsAsBase64] Starting for fonts:", fontNames);

  for (const fontName of fontNames) {
    try {
      // Fetch the CSS from Google Fonts
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800&display=swap`;
      console.log("[fetchGoogleFontsAsBase64] Fetching CSS from:", fontUrl);

      const response = await fetch(fontUrl);

      if (!response.ok) {
        console.warn("[fetchGoogleFontsAsBase64] Failed to fetch CSS:", response.status);
        continue;
      }

      let css = await response.text();
      console.log("[fetchGoogleFontsAsBase64] Got CSS, length:", css.length);

      // Find all url() references in the CSS and convert to base64
      // Use Array.from to avoid iterator consumption issues
      const urlRegex = /url\((https:\/\/[^)]+)\)/g;
      const allUrls: string[] = [];
      let urlMatch;
      while ((urlMatch = urlRegex.exec(css)) !== null) {
        allUrls.push(urlMatch[1]);
      }

      console.log("[fetchGoogleFontsAsBase64] Found font URLs:", allUrls.length);

      for (const fontFileUrl of allUrls) {
        try {
          console.log("[fetchGoogleFontsAsBase64] Fetching font file:", fontFileUrl);
          const fontResponse = await fetch(fontFileUrl);
          if (fontResponse.ok) {
            const fontBlob = await fontResponse.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(fontBlob);
            });
            // Replace ALL occurrences of this URL
            css = css.split(fontFileUrl).join(base64);
            console.log("[fetchGoogleFontsAsBase64] Converted to base64, new length:", css.length);
          }
        } catch (fontFileError) {
          console.warn(`[fetchGoogleFontsAsBase64] Failed to fetch font file: ${fontFileUrl}`, fontFileError);
        }
      }

      fontCSS.push(css);
    } catch (error) {
      console.warn(`[fetchGoogleFontsAsBase64] Failed to fetch font: ${fontName}`, error);
    }
  }

  const result = fontCSS.join('\n');
  console.log("[fetchGoogleFontsAsBase64] Final CSS length:", result.length);
  return result;
}

// Extract font names used in the iframe
function extractFontNamesFromIframe(iframeDoc: Document, iframeWindow: Window | null): string[] {
  const fontNames = new Set<string>();

  // System/generic fonts to exclude - these don't need to be fetched from Google
  const excludedFonts = [
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
    'inherit', 'initial', 'unset', 'revert', 'none',
    'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded',
    '-apple-system', 'blinkmacsystemfont',
    'segoe ui', 'segoe ui emoji', 'segoe ui symbol',
    'arial', 'helvetica', 'helvetica neue', 'verdana', 'tahoma', 'trebuchet ms',
    'times', 'times new roman', 'georgia', 'garamond', 'palatino',
    'courier', 'courier new', 'lucida console', 'monaco',
    'apple color emoji', 'noto color emoji', 'android emoji', 'emojisymbols',
    'symbola', 'webdings', 'wingdings'
  ];

  // Helper to check if a font name looks like a Google Font (not a system font)
  const isLikelyGoogleFont = (fontName: string): boolean => {
    const lower = fontName.toLowerCase();
    // Exclude system fonts
    if (excludedFonts.includes(lower)) return false;
    // Must start with uppercase (Google Fonts convention)
    if (!/^[A-Z]/.test(fontName)) return false;
    // Exclude fonts that are clearly emoji/symbol fonts
    if (lower.includes('emoji') || lower.includes('symbol')) return false;
    return true;
  };

  // Check style tag with Google Fonts imports
  const fontStyleTag = iframeDoc.getElementById("buildix-font-imports");
  if (fontStyleTag && fontStyleTag.textContent) {
    console.log("[extractFontNamesFromIframe] Found font style tag:", fontStyleTag.textContent);
    const regex = /family=([^:&]+)/g;
    let match;
    while ((match = regex.exec(fontStyleTag.textContent)) !== null) {
      const fontName = match[1].replace(/\+/g, ' ');
      console.log("[extractFontNamesFromIframe] Found font from style tag:", fontName);
      fontNames.add(fontName);
    }
  }

  // Check all style tags for @import rules with Google Fonts
  const allStyleTags = iframeDoc.querySelectorAll('style');
  allStyleTags.forEach((styleTag) => {
    const content = styleTag.textContent || '';
    // Look for @import url with Google Fonts
    const importRegex = /@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com[^'")\s]+)['"]?\)/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      const url = importMatch[1];
      const familyMatch = url.match(/family=([^:&]+)/);
      if (familyMatch) {
        const fontName = familyMatch[1].replace(/\+/g, ' ');
        console.log("[extractFontNamesFromIframe] Found font from @import:", fontName);
        fontNames.add(fontName);
      }
    }
  });

  // Check inline styles on ALL elements (most reliable for AI-generated content)
  const allElements = iframeDoc.querySelectorAll('*');
  allElements.forEach((el) => {
    const element = el as HTMLElement;

    // Check inline style attribute directly
    const styleAttr = element.getAttribute('style');
    if (styleAttr && styleAttr.includes('font-family')) {
      // Extract font-family value from style attribute
      const fontFamilyMatch = styleAttr.match(/font-family:\s*([^;]+)/i);
      if (fontFamilyMatch) {
        const fontStack = fontFamilyMatch[1].split(',');
        for (const font of fontStack) {
          const fontName = font.trim().replace(/['"]/g, '');
          if (fontName && isLikelyGoogleFont(fontName)) {
            console.log("[extractFontNamesFromIframe] Found font from inline style:", fontName);
            fontNames.add(fontName);
          }
        }
      }
    }

    // Also check element.style.fontFamily (for programmatically set styles)
    if (element.style.fontFamily) {
      const fontStack = element.style.fontFamily.split(',');
      for (const font of fontStack) {
        const fontName = font.trim().replace(/['"]/g, '');
        if (fontName && isLikelyGoogleFont(fontName)) {
          console.log("[extractFontNamesFromIframe] Found font from style property:", fontName);
          fontNames.add(fontName);
        }
      }
    }
  });

  // Also check computed styles but only for elements that actually have text
  if (iframeWindow) {
    const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, button');
    textElements.forEach((el) => {
      const element = el as HTMLElement;
      // Only check if element has actual text content
      if (element.textContent && element.textContent.trim()) {
        try {
          const computedStyle = iframeWindow.getComputedStyle(element);
          const computedFont = computedStyle.fontFamily;
          if (computedFont) {
            // Get the first font in the stack (the one actually being used)
            const fonts = computedFont.split(',');
            const primaryFont = fonts[0]?.trim().replace(/['"]/g, '');
            if (primaryFont && isLikelyGoogleFont(primaryFont)) {
              console.log("[extractFontNamesFromIframe] Found font from computed style:", primaryFont);
              fontNames.add(primaryFont);
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });
  }

  const result = Array.from(fontNames);
  console.log("[extractFontNamesFromIframe] All fonts found:", result);
  return result;
}
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
import { PrototypeModal } from "./modals/PrototypeModal";

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
  const [showPrototypeModal, setShowPrototypeModal] = useState(false);
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
  // NOTE: This should NOT be called during render as syncHtmlFromIframe causes setState
  const getExportHtml = (shouldSync: boolean = true) => {
    // Sync from iframe first if in design mode to get latest changes
    // Only sync if explicitly requested (not during render)
    if (shouldSync && viewMode === "design") {
      syncHtmlFromIframe();
    }
    // Get the updated htmlContent from the store
    const currentHtml = useEditorStore.getState().htmlContent;
    return injectBackgroundAssets(currentHtml, backgroundAssets);
  };

  // Get HTML without triggering sync (safe to call during render)
  const getExportHtmlSafe = () => {
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
      const iframeDoc = iframe.contentDocument;

      // Aguardar carregamento de todas as fontes no iframe
      if (iframeWindow?.document?.fonts) {
        await iframeWindow.document.fonts.ready;
      }

      // Extrair nomes das fontes usadas no iframe e buscar como base64
      const fontNames = extractFontNamesFromIframe(iframeDoc, iframeWindow);
      console.log("[Export] Fonts detected:", fontNames);

      let fontEmbedCSS: string | undefined;
      if (fontNames.length > 0) {
        try {
          fontEmbedCSS = await fetchGoogleFontsAsBase64(fontNames);
          console.log("[Export] Font CSS generated, length:", fontEmbedCSS?.length);
        } catch (fontError) {
          console.warn("Não foi possível embarcar fontes:", fontError);
        }
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
      const iframeDoc = iframe.contentDocument;

      // 1. Aguardar carregamento de todas as fontes no iframe
      if (iframeWindow?.document?.fonts) {
        await iframeWindow.document.fonts.ready;
      }

      // 2. Extrair nomes das fontes usadas no iframe e buscar como base64
      const fontNames = extractFontNamesFromIframe(iframeDoc, iframeWindow);
      console.log("[Export] Fonts detected:", fontNames);

      let fontEmbedCSS: string | undefined;
      if (fontNames.length > 0) {
        try {
          fontEmbedCSS = await fetchGoogleFontsAsBase64(fontNames);
          console.log("[Export] Font CSS generated, length:", fontEmbedCSS?.length);
        } catch (fontError) {
          console.warn("Não foi possível embarcar fontes:", fontError);
        }
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

  // Export mobile app screens as ZIP with multiple images
  const handleExportMobileAppAsZip = async () => {
    const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
    if (!iframe?.contentDocument) {
      console.error("Cannot access iframe content");
      setExportError("Não foi possível acessar o conteúdo do iframe.");
      return;
    }

    // Find all app screens
    const screens = iframe.contentDocument.querySelectorAll(".app-screen");
    if (screens.length === 0) {
      // Fallback: try to find first child elements in body
      const bodyChildren = iframe.contentDocument.body.children;
      if (bodyChildren.length === 0) {
        console.error("No screens found to export");
        setExportError("Nenhuma tela encontrada para exportar.");
        return;
      }
      // If no app-screen class, export single image instead
      await handleExportAsImage();
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const zip = new JSZip();
      let failedScreens = 0;
      const iframeWindow = iframe.contentWindow;
      const iframeDoc = iframe.contentDocument;

      // 1. Aguardar carregamento de todas as fontes no iframe
      if (iframeWindow?.document?.fonts) {
        await iframeWindow.document.fonts.ready;
      }

      // 2. Extrair nomes das fontes usadas no iframe e buscar como base64
      const fontNames = extractFontNamesFromIframe(iframeDoc, iframeWindow);
      console.log("[Export Mobile] Fonts detected:", fontNames);

      let fontEmbedCSS: string | undefined;
      if (fontNames.length > 0) {
        try {
          fontEmbedCSS = await fetchGoogleFontsAsBase64(fontNames);
          console.log("[Export Mobile] Font CSS generated, length:", fontEmbedCSS?.length);
        } catch (fontError) {
          console.warn("Não foi possível embarcar fontes:", fontError);
        }
      }

      for (let i = 0; i < screens.length; i++) {
        const screen = screens[i] as HTMLElement;

        // Get the computed background color of the screen
        const computedStyle = iframeWindow?.getComputedStyle(screen);
        let bgColor = computedStyle?.backgroundColor || "#fff";

        // If background is transparent or not set, check inline style or use default
        if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
          // Try to get from inline style
          bgColor = screen.style.backgroundColor || "#fff";
        }

        try {
          const blob = await toBlob(screen, {
            width: 390,
            height: 844,
            pixelRatio: 2,
            backgroundColor: bgColor,
            skipAutoScale: true,
            cacheBust: true,
            fontEmbedCSS,
            preferredFontFormat: "woff2",
            filter: (node) => {
              // Skip broken images to prevent export failure
              if (node instanceof HTMLImageElement && !node.complete) {
                return false;
              }
              return true;
            },
          });
          if (blob) {
            zip.file(`screen-${String(i + 1).padStart(2, "0")}.png`, blob);
          } else {
            failedScreens++;
            console.warn(`Screen ${i + 1} gerou blob vazio`);
          }
        } catch (screenError) {
          failedScreens++;
          console.warn(`Falha ao exportar screen ${i + 1}:`, screenError);
        }
      }

      // Check if any screens were exported
      const exportedCount = screens.length - failedScreens;
      if (exportedCount === 0) {
        setExportError("Nenhuma tela foi exportada. Verifique se as imagens carregaram corretamente.");
        return;
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${projectName || "mobile-app"}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);

      // Show warning if some screens failed
      if (failedScreens > 0) {
        setExportError(`Aviso: ${failedScreens} tela(s) não foram exportadas devido a imagens com erro.`);
      }
    } catch (error) {
      console.error("Export mobile app failed:", error);
      setExportError("Erro ao exportar mobile app. Verifique se todas as imagens carregaram.");
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

        {/* Prototype Button - Only shows for mobile-app content */}
        {htmlContent && htmlContent.includes('class="app-screen') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
                onClick={() => {
                  // Sync HTML first to get latest changes
                  if (viewMode === "design") {
                    syncHtmlFromIframe();
                  }
                  setShowPrototypeModal(true);
                }}
              >
                <Play className="h-3.5 w-3.5" />
                Prototipar
              </Button>
            </TooltipTrigger>
            <TooltipContent>Navegar entre telas como um app real</TooltipContent>
          </Tooltip>
        )}

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
            <DropdownMenuItem onClick={handleExportMobileAppAsZip} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Export Mobile App (ZIP)
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

      {/* Prototype Modal */}
      <PrototypeModal
        open={showPrototypeModal}
        onOpenChange={setShowPrototypeModal}
        html={getExportHtmlSafe()}
        pageId={currentPage?.id}
      />
    </header>
  );
}
