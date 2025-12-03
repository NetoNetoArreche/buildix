"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Code, Video, Image as ImageIcon, RotateCcw, Layers, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmbedTab } from "./asset-tabs/EmbedTab";
import { VideoTab } from "./asset-tabs/VideoTab";
import { ImageAssetTab } from "./asset-tabs/ImageAssetTab";
import { DesignAssetsTab } from "./asset-tabs/DesignAssetsTab";
import { AssetControlsPanel } from "./asset-tabs/AssetControlsPanel";
import { ImageSelectorModal } from "./ImageSelectorModal";
import { updateAssetInDocument } from "@/lib/asset-detection";
import { useEditorStore } from "@/stores/editorStore";
import type {
  BackgroundAsset,
  BackgroundAssetType,
  BlendModeType,
  DetectedAsset,
} from "@/types";
import { defaultBackgroundAsset } from "@/types";
import { cn, getPreviewIframe } from "@/lib/utils";

type ModalTabType = BackgroundAssetType | "design";

interface AssetBackgroundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyAsset: (asset: BackgroundAsset) => void;
  editingAsset?: BackgroundAsset | null;
}

function generateId(): string {
  return `bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function AssetBackgroundModal({
  open,
  onOpenChange,
  onApplyAsset,
  editingAsset,
}: AssetBackgroundModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTabType>(
    editingAsset?.type || "embed"
  );
  const { setHtmlContent } = useEditorStore();

  // Asset state (for background asset creation)
  const [asset, setAsset] = useState<Partial<BackgroundAsset>>(
    editingAsset || {
      ...defaultBackgroundAsset,
      id: generateId(),
      type: "embed",
      src: "",
    }
  );

  // Design asset editing state
  const [editingDesignAsset, setEditingDesignAsset] = useState<DetectedAsset | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Iframe loading state
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  // Sync state when modal opens with editingAsset
  useEffect(() => {
    if (open && editingAsset) {
      // When opening to edit, load the existing asset data
      setAsset(editingAsset);
      setActiveTab(editingAsset.type);
    } else if (open && !editingAsset) {
      // When opening for new asset, reset to defaults
      setAsset({
        ...defaultBackgroundAsset,
        id: generateId(),
        type: "embed",
        src: "",
      });
      setActiveTab("embed");
    }
  }, [open, editingAsset]);

  // Track if a source has been selected (only for background asset tabs)
  const hasSource = Boolean(asset.src);
  const isDesignTab = activeTab === "design";

  // Update asset property
  const updateAsset = useCallback(
    (updates: Partial<BackgroundAsset>) => {
      setAsset((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Handle source selection from tabs
  const handleSourceSelect = useCallback(
    (src: string, type: BackgroundAssetType, extra?: Partial<BackgroundAsset>) => {
      // Start loading for embed types
      if (type === "embed") {
        setIsIframeLoading(true);
      }
      setAsset((prev) => ({
        ...prev,
        ...defaultBackgroundAsset,
        id: prev.id || generateId(),
        type,
        src,
        ...extra,
      }));
    },
    []
  );

  // Reset to defaults
  const handleReset = useCallback(() => {
    setAsset({
      ...defaultBackgroundAsset,
      id: asset.id || generateId(),
      type: activeTab === "design" ? "embed" : activeTab,
      src: asset.src || "",
    });
  }, [activeTab, asset.id, asset.src]);

  // Apply asset
  const handleApply = useCallback(() => {
    if (!asset.src) return;

    const finalAsset: BackgroundAsset = {
      ...defaultBackgroundAsset,
      ...asset,
      id: asset.id || generateId(),
      type: asset.type || (activeTab === "design" ? "embed" : activeTab),
      src: asset.src,
    } as BackgroundAsset;

    onApplyAsset(finalAsset);
    onOpenChange(false);
  }, [asset, activeTab, onApplyAsset, onOpenChange]);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ModalTabType);
    // Reset source when changing tabs, but keep settings (only for non-design tabs)
    if (value !== "design") {
      setAsset((prev) => ({
        ...prev,
        type: value as BackgroundAssetType,
        src: "",
        embedCode: undefined,
        embedType: undefined,
      }));
    }
  }, []);

  // Handle design asset selection (opens image selector modal)
  const handleDesignAssetSelect = useCallback((detectedAsset: DetectedAsset) => {
    setEditingDesignAsset(detectedAsset);
    setShowImageSelector(true);
  }, []);

  // Handle image selection for design asset replacement
  const handleImageSelected = useCallback((newImageUrl: string) => {
    if (!editingDesignAsset) return;

    // Get the preview iframe (works in both normal and Canvas Mode)
    const iframe = getPreviewIframe();

    if (!iframe?.contentDocument) {
      console.error("Could not access iframe document");
      return;
    }

    // Update the asset in the document
    const success = updateAssetInDocument(iframe.contentDocument, editingDesignAsset, newImageUrl);
    console.log("[DesignTab] updateAssetInDocument success:", success, "newImageUrl:", newImageUrl);

    if (success) {
      // Extract the full HTML document (not just body innerHTML)
      const doc = iframe.contentDocument;

      // Clone the entire document
      const docClone = doc.documentElement.cloneNode(true) as HTMLElement;

      // Remove any editor-specific elements from the clone
      docClone.querySelectorAll('[data-buildix-bg-asset]').forEach(el => el.remove());
      docClone.querySelectorAll('[data-editor-overlay]').forEach(el => el.remove());
      docClone.querySelectorAll('.buildix-element-label').forEach(el => el.remove());
      docClone.querySelectorAll('.buildix-action-bar').forEach(el => el.remove());
      docClone.querySelectorAll('.buildix-spacing-label').forEach(el => el.remove());

      // Remove buildix-specific attributes and classes from elements
      docClone.querySelectorAll('[data-buildix-id]').forEach(el => {
        el.removeAttribute('data-buildix-id');
      });
      docClone.querySelectorAll('.buildix-hoverable, .buildix-selected').forEach(el => {
        el.classList.remove('buildix-hoverable', 'buildix-selected');
      });

      // Remove the selection styles we injected
      const selectionStyles = docClone.querySelector('#buildix-selection-styles');
      if (selectionStyles) selectionStyles.remove();

      // Build the full HTML document
      const doctype = '<!DOCTYPE html>';
      const updatedHtml = doctype + '\n' + docClone.outerHTML;

      console.log("[DesignTab] Setting HTML content, includes new URL:", updatedHtml.includes(newImageUrl));
      console.log("[DesignTab] HTML length:", updatedHtml.length);

      // Update the store with new HTML content
      setHtmlContent(updatedHtml);

      // Force update ALL iframes to reflect the change immediately
      // This is necessary because:
      // 1. The iframe we modified already has the DOM change
      // 2. Other iframes (other canvas frames, normal preview) need to be updated
      // 3. React's srcDoc updates may not trigger immediately due to reference comparison

      // Update all Canvas Mode iframes
      const allCanvasIframes = document.querySelectorAll('iframe[title^="Preview - "]') as NodeListOf<HTMLIFrameElement>;
      console.log("[DesignTab] Found", allCanvasIframes.length, "Canvas Mode iframes to update");
      allCanvasIframes.forEach((canvasIframe, idx) => {
        if (canvasIframe !== iframe) {
          console.log("[DesignTab] Updating Canvas iframe", idx);
          canvasIframe.srcdoc = updatedHtml;
        }
      });

      // Also update the normal preview iframe if it exists and wasn't the one modified
      const normalIframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
      if (normalIframe && normalIframe !== iframe) {
        console.log("[DesignTab] Updating normal Preview iframe");
        normalIframe.srcdoc = updatedHtml;
      }

      // Also force update the modified iframe to ensure it has clean HTML
      // (the DOM was modified directly, but srcdoc should match for consistency)
      console.log("[DesignTab] Updating source iframe srcdoc");
      iframe.srcdoc = updatedHtml;
    } else {
      console.error("[DesignTab] Failed to update asset in document");
    }

    setShowImageSelector(false);
    setEditingDesignAsset(null);
  }, [editingDesignAsset, setHtmlContent]);

  // Build preview styles
  const previewStyles = useMemo(() => {
    const filters = [];
    if (asset.hue && asset.hue !== 0) filters.push(`hue-rotate(${asset.hue}deg)`);
    if (asset.saturation && asset.saturation !== 100)
      filters.push(`saturate(${asset.saturation}%)`);
    if (asset.brightness && asset.brightness !== 100)
      filters.push(`brightness(${asset.brightness}%)`);
    if (asset.blur && asset.blur > 0) filters.push(`blur(${asset.blur}px)`);
    if (asset.invert) filters.push(`invert(100%)`);

    return {
      filter: filters.length > 0 ? filters.join(" ") : "none",
      opacity: (asset.opacity ?? 100) / 100,
      mixBlendMode: (asset.blendMode || "normal") as BlendModeType,
    };
  }, [asset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>
            {editingAsset ? "Edit Background Asset" : "Add Background Asset"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left side - Source selection + Preview */}
          <div className="flex-1 flex flex-col overflow-hidden border-r">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 pt-4 shrink-0">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="embed" className="gap-2">
                    <Code className="h-4 w-4" />
                    <span className="hidden sm:inline">Embed</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Video className="h-4 w-4" />
                    <span className="hidden sm:inline">Video</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="design" className="gap-2">
                    <Layers className="h-4 w-4" />
                    <span className="hidden sm:inline">Design</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  <TabsContent value="embed" className="mt-0">
                    <EmbedTab
                      onSelectEmbed={(data) =>
                        handleSourceSelect(data.src, "embed", {
                          embedType: data.type,
                          embedCode: data.code,
                        })
                      }
                      selectedSrc={activeTab === "embed" ? asset.src : undefined}
                    />
                  </TabsContent>

                  <TabsContent value="video" className="mt-0">
                    <VideoTab
                      onSelectVideo={(data) =>
                        handleSourceSelect(data.src, "video")
                      }
                      selectedSrc={activeTab === "video" ? asset.src : undefined}
                    />
                  </TabsContent>

                  <TabsContent value="image" className="mt-0">
                    <ImageAssetTab
                      onSelectImage={(url) => handleSourceSelect(url, "image")}
                      selectedSrc={activeTab === "image" ? asset.src : undefined}
                    />
                  </TabsContent>

                  <TabsContent value="design" className="mt-0">
                    <DesignAssetsTab onSelectAsset={handleDesignAssetSelect} />
                  </TabsContent>

                  {/* Large Preview with Applied Effects - shows when source is selected (not for design tab) */}
                  {hasSource && !isDesignTab && (
                    <div className="mt-6 space-y-2">
                      <div className="text-sm font-medium">Preview (with effects)</div>
                      <div className="aspect-video rounded-lg border overflow-hidden bg-zinc-900 relative">
                        {/* Content with filters applied */}
                        <div
                          className="absolute inset-0"
                          style={previewStyles}
                        >
                          {asset.type === "image" && asset.src && (
                            <img
                              src={asset.src}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {asset.type === "video" && asset.src && (
                            <video
                              src={asset.src}
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          )}
                          {asset.type === "embed" && asset.src && (
                            <>
                              {isIframeLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
                                    <span className="text-xs text-muted-foreground">Loading embed...</span>
                                  </div>
                                </div>
                              )}
                              <iframe
                                src={asset.src}
                                className="w-full h-full border-0"
                                title="Embed Preview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                style={{ colorScheme: 'normal' }}
                                onLoad={() => setIsIframeLoading(false)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right side - Controls (only visible when source is selected, hidden for design tab) */}
          {!isDesignTab && (
          <div
            className={cn(
              "w-80 flex flex-col overflow-hidden transition-all duration-300",
              hasSource ? "opacity-100" : "opacity-50 pointer-events-none"
            )}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
              <span className="text-sm font-medium">Advanced Controls</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <AssetControlsPanel
                  asset={asset as BackgroundAsset}
                  onUpdate={updateAsset}
                />
              </div>
            </ScrollArea>
          </div>
          )}
        </div>

        {/* Footer - only show for background asset tabs */}
        {!isDesignTab && (
          <div className="px-6 py-4 border-t flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="buildix"
              onClick={handleApply}
              disabled={!hasSource}
            >
              {editingAsset ? "Update" : "Apply"}
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Image Selector Modal for Design Asset replacement */}
      <ImageSelectorModal
        open={showImageSelector}
        onOpenChange={(open) => {
          setShowImageSelector(open);
          if (!open) setEditingDesignAsset(null);
        }}
        onSelectImage={handleImageSelected}
      />
    </Dialog>
  );
}
