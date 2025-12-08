"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Check, AlertCircle, Figma } from "lucide-react";
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

interface FigmaExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FigmaExportModal({ open, onOpenChange }: FigmaExportModalProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const clipboardDataRef = useRef<string | null>(null);

  const { htmlContent } = useEditorStore();

  // Reset state when modal opens and start conversion
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setIsConverting(false);
      setIsReady(false);
      clipboardDataRef.current = null;

      // Start conversion immediately when modal opens
      if (htmlContent) {
        convertToFigma();
      }
    }
  }, [open, htmlContent]);

  const convertToFigma = async () => {
    if (!htmlContent) {
      setError("Nenhum conteúdo para exportar. Crie um design primeiro.");
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const response = await fetch("/api/figma/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlContent }),
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
      setError(err instanceof Error ? err.message : "Falha na conversão");
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopyToFigma = async () => {
    if (!clipboardDataRef.current) {
      setError("Dados não prontos. Tente novamente.");
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
      setError("Falha ao copiar. Verifique as permissões do navegador.");
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
            {isConverting ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-[#a259ff]" />
                <div>
                  <p className="text-sm text-white font-medium">Convertendo para Figma...</p>
                  <p className="text-xs text-gray-400">Transformando HTML em layers editáveis</p>
                </div>
              </div>
            ) : isReady ? (
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-[#0acf83]" />
                <div>
                  <p className="text-sm text-white font-medium">Pronto para copiar!</p>
                  <p className="text-xs text-gray-400">
                    Clique no botão abaixo e depois cole no Figma com{" "}
                    <kbd className="px-1.5 py-0.5 bg-[#333] rounded text-xs font-mono">Ctrl+V</kbd>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-300 leading-relaxed">
                Clique no botão abaixo para converter e copiar o design. Depois, vá ao Figma e pressione{" "}
                <kbd className="px-1.5 py-0.5 bg-[#333] rounded text-xs font-mono">Ctrl+V</kbd>{" "}
                para colar. O design será convertido automaticamente em layers editáveis.
              </p>
            )}
          </div>

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
            disabled={isConverting || !isReady || !htmlContent || success}
            className={cn(
              "bg-[#a259ff] hover:bg-[#a259ff]/90 text-white font-medium",
              (isConverting || !isReady) && "opacity-70"
            )}
          >
            {isConverting ? (
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
