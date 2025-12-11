"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Check, AlertCircle, Figma, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";
import { injectBackgroundAssets } from "@/lib/background-assets";
import { preprocessHtmlForFigma, hasProblematicUrls } from "@/lib/figma-image-processor";

interface FigmaExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FigmaExportModal({ open, onOpenChange }: FigmaExportModalProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const clipboardDataRef = useRef<string | null>(null);

  const { htmlContent, backgroundAssets, viewMode, syncHtmlFromIframe } = useEditorStore();

  // Get the complete HTML with background assets
  const getCompleteHtml = (): string => {
    // Sync from iframe first if in design mode to get latest changes
    if (viewMode === "design") {
      syncHtmlFromIframe();
    }
    // Get the updated htmlContent from the store
    const currentHtml = useEditorStore.getState().htmlContent;
    // Inject background assets into the HTML
    return injectBackgroundAssets(currentHtml, backgroundAssets);
  };

  // Reset state when modal opens and start conversion
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setIsConverting(false);
      setIsProcessingImages(false);
      setIsReady(false);
      setImageWarnings([]);
      setProcessedCount(0);
      clipboardDataRef.current = null;

      // Start conversion immediately when modal opens
      if (htmlContent) {
        convertToFigma();
      }
    }
  }, [open]);

  const convertToFigma = async () => {
    const completeHtml = getCompleteHtml();

    if (!completeHtml) {
      setError("Nenhum conteudo para exportar. Crie um design primeiro.");
      return;
    }

    setIsProcessingImages(true);
    setError(null);

    try {
      // Step 1: Check for problematic URLs
      const urlCheck = hasProblematicUrls(completeHtml);

      if (urlCheck.hasBlobUrls || urlCheck.hasRelativeUrls || urlCheck.hasExternalUrls) {
        console.log("[FigmaExport] Processing images...", {
          blobUrls: urlCheck.blobUrls.length,
          relativeUrls: urlCheck.relativeUrls.length,
          externalUrls: urlCheck.externalUrls.length,
        });
      }

      // Step 2: Preprocess images (convert blobs, relative, and external URLs to base64)
      const processResult = await preprocessHtmlForFigma(completeHtml, {
        convertBlobsToBase64: true,
        convertRelativeToAbsolute: true,
        convertExternalToBase64: true,
      });

      setProcessedCount(processResult.processedImages);

      if (processResult.warnings.length > 0) {
        setImageWarnings(processResult.warnings);
        console.warn("[FigmaExport] Image warnings:", processResult.warnings);
      }

      if (processResult.failedImages.length > 0) {
        console.warn("[FigmaExport] Failed images:", processResult.failedImages);
      }

      setIsProcessingImages(false);
      setIsConverting(true);

      // Step 3: Send processed HTML to API
      const response = await fetch("/api/figma/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: processResult.html }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao converter para Figma");
      }

      // Store the clipboard data
      clipboardDataRef.current = data.clipboardData;
      setIsReady(true);
    } catch (err) {
      console.error("Failed to convert to Figma:", err);
      setError(err instanceof Error ? err.message : "Falha na conversao");
    } finally {
      setIsConverting(false);
      setIsProcessingImages(false);
    }
  };

  const handleCopyToFigma = async () => {
    if (!clipboardDataRef.current) {
      setError("Dados nao prontos. Tente novamente.");
      return;
    }

    try {
      // Use the copy event to set clipboard data in the correct format
      const copyHandler = (e: ClipboardEvent) => {
        if (clipboardDataRef.current) {
          e.clipboardData?.setData("text/html", clipboardDataRef.current);
          e.preventDefault();
        }
      };

      document.addEventListener("copy", copyHandler);

      // Trigger the copy
      const success = document.execCommand("copy");

      document.removeEventListener("copy", copyHandler);

      if (success) {
        setSuccess(true);
        // Close modal after a short delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        // Fallback: try using clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([clipboardDataRef.current], { type: "text/html" }),
          }),
        ]);
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Falha ao copiar. Verifique as permissoes do navegador.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#a259ff]/10 rounded-lg">
              <Figma className="h-5 w-5 text-[#a259ff]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Copiar para Figma
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-400">
                Cole diretamente no Figma com Ctrl+V
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="bg-[#252525] rounded-lg p-4 border border-[#333]">
            {isProcessingImages ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-[#a259ff]" />
                <div>
                  <p className="text-sm text-white font-medium">Processando imagens...</p>
                  <p className="text-xs text-gray-400">Convertendo URLs para formato compativel</p>
                </div>
              </div>
            ) : isConverting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-[#a259ff]" />
                <div>
                  <p className="text-sm text-white font-medium">Convertendo para Figma...</p>
                  <p className="text-xs text-gray-400">
                    Transformando HTML em layers editaveis
                    {processedCount > 0 && ` (${processedCount} imagens processadas)`}
                  </p>
                </div>
              </div>
            ) : isReady ? (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-[#0acf83]" />
                <div>
                  <p className="text-sm text-white font-medium">Pronto para copiar!</p>
                  <p className="text-xs text-gray-400">
                    Clique no botao abaixo e depois cole no Figma com{" "}
                    <kbd className="px-1.5 py-0.5 bg-[#333] rounded text-xs font-mono">Ctrl+V</kbd>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed">
                Clique no botao abaixo para converter e copiar o design. Depois, va ao Figma e pressione{" "}
                <kbd className="px-1.5 py-0.5 bg-[#333] rounded text-xs font-mono">Ctrl+V</kbd>{" "}
                para colar. O design sera convertido automaticamente em layers editaveis.
              </p>
            )}
          </div>

          {/* Image Warnings */}
          {imageWarnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400 font-medium">Aviso sobre imagens</p>
                <p className="text-xs text-yellow-400/80 mt-1">
                  {imageWarnings.length} imagem(ns) podem nao aparecer corretamente no Figma.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-[#0acf83]/10 border border-[#0acf83]/30 rounded-lg p-3 flex items-start gap-2">
              <Check className="h-4 w-4 text-[#0acf83] shrink-0 mt-0.5" />
              <p className="text-sm text-[#0acf83]">
                Copiado! Agora cole no Figma com Ctrl+V
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[#333]">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white hover:bg-[#252525]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCopyToFigma}
            disabled={isConverting || isProcessingImages || !isReady || !htmlContent || success}
            className={cn(
              "bg-[#a259ff] hover:bg-[#a259ff]/90 text-white font-medium",
              (isConverting || isProcessingImages || !isReady) && "opacity-70"
            )}
          >
            {isProcessingImages ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : isConverting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Convertendo...
              </>
            ) : success ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Figma className="h-4 w-4 mr-2" />
                Copiar para Figma
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
