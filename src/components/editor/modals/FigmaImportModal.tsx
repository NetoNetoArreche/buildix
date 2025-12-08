"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Link2,
  Key,
  Figma,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editorStore";

interface FigmaImportResult {
  html: string;
  nodeName: string;
  fileName: string;
  nodeId: string;
}

interface FigmaImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (result: FigmaImportResult) => void;
}

interface ImportOptions {
  preserveAutoLayout: boolean;
  convertEffects: boolean;
  importVariants: boolean;
}

const FIGMA_TOKEN_KEY = "buildix-figma-token";

export function FigmaImportModal({ open, onOpenChange, onImport }: FigmaImportModalProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [personalToken, setPersonalToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    preserveAutoLayout: true,
    convertEffects: true,
    importVariants: false,
  });

  const { setHtmlContent, htmlContent } = useEditorStore();

  // Load saved token from localStorage on mount
  useEffect(() => {
    if (open) {
      const savedToken = localStorage.getItem(FIGMA_TOKEN_KEY);
      if (savedToken) {
        setPersonalToken(savedToken);
      }
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  // Save token to localStorage when it changes
  const handleTokenChange = (value: string) => {
    setPersonalToken(value);
    if (value) {
      localStorage.setItem(FIGMA_TOKEN_KEY, value);
    } else {
      localStorage.removeItem(FIGMA_TOKEN_KEY);
    }
  };

  const handleImport = async () => {
    if (!figmaUrl) {
      setError("Cole a URL do Figma");
      return;
    }

    if (!personalToken) {
      setError("Cole seu Personal Access Token do Figma");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/figma/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          figmaUrl,
          options,
          personalToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao importar do Figma");
      }

      // Handle imported HTML
      if (data.html) {
        if (onImport) {
          // Use callback if provided (e.g., dashboard creating new project)
          onImport({
            html: data.html,
            nodeName: data.nodeName,
            fileName: data.fileName,
            nodeId: data.nodeId,
          });
        } else {
          // Default behavior: inject into editor
          const newContent = htmlContent
            ? `${htmlContent}\n\n<!-- Imported: ${data.nodeName} -->\n${data.html}`
            : data.html;
          setHtmlContent(newContent);
        }
        setSuccess(`Importado "${data.nodeName}" de ${data.fileName}`);

        // Close modal after short delay
        setTimeout(() => {
          onOpenChange(false);
          setFigmaUrl("");
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na importação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0acf83]/10 rounded-lg">
              <Figma className="h-5 w-5 text-[#0acf83]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Importar do Figma
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-400">
                Importe frames e componentes diretamente do Figma
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Personal Access Token */}
          <div className="space-y-2">
            <Label htmlFor="figma-token" className="text-sm text-gray-300 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Personal Access Token
            </Label>
            <div className="relative">
              <Input
                id="figma-token"
                type={showToken ? "text" : "password"}
                value={personalToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="bg-[#252525] border-[#333] text-white placeholder:text-gray-500 focus:border-[#0acf83] focus:ring-[#0acf83]/20 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Gere um token com os scopes <span className="text-white font-medium">file_content:read</span> e <span className="text-white font-medium">file_metadata:read</span> em{" "}
              <a
                href="https://www.figma.com/developers/api#access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0acf83] hover:underline inline-flex items-center gap-1"
              >
                Figma Settings
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-[#252525] rounded-lg p-4 border border-[#333]">
            <p className="text-sm text-gray-300 leading-relaxed">
              No Figma, selecione qualquer Frame e clique com botão direito &gt;{" "}
              <span className="text-white font-medium">Copiar/Colar como</span> &gt;{" "}
              <span className="text-white font-medium">Copiar link para a seleção</span>.
            </p>
          </div>

          {/* Figma URL Input */}
          <div className="space-y-2">
            <Label htmlFor="figma-url" className="text-sm text-gray-300 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              URL do Figma
            </Label>
            <Input
              id="figma-url"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/design/FILE_KEY/Title?node-id=..."
              className="bg-[#252525] border-[#333] text-white placeholder:text-gray-500 focus:border-[#0acf83] focus:ring-[#0acf83]/20"
            />
          </div>

          {/* Import Options */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-300">Opções de Importação</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 rounded hover:bg-[#252525] cursor-pointer transition-colors">
                <Switch
                  checked={options.preserveAutoLayout}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, preserveAutoLayout: checked })
                  }
                  className="data-[state=checked]:bg-[#0acf83]"
                />
                <div>
                  <span className="text-sm text-white">Preservar Auto-layout</span>
                  <p className="text-xs text-gray-500">Converter para Flexbox CSS</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded hover:bg-[#252525] cursor-pointer transition-colors">
                <Switch
                  checked={options.convertEffects}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, convertEffects: checked })
                  }
                  className="data-[state=checked]:bg-[#0acf83]"
                />
                <div>
                  <span className="text-sm text-white">Converter Efeitos</span>
                  <p className="text-xs text-gray-500">Sombras, blur e outros efeitos para CSS</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded hover:bg-[#252525] cursor-pointer transition-colors">
                <Switch
                  checked={options.importVariants}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, importVariants: checked })
                  }
                  className="data-[state=checked]:bg-[#0acf83]"
                />
                <div>
                  <span className="text-sm text-white">Importar Variantes</span>
                  <p className="text-xs text-gray-500">Criar classes CSS para cada variante</p>
                </div>
              </label>
            </div>
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
              <p className="text-sm text-[#0acf83]">{success}</p>
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
            onClick={handleImport}
            disabled={isLoading || !figmaUrl || !personalToken}
            className={cn(
              "bg-[#0acf83] hover:bg-[#0acf83]/90 text-black font-medium",
              isLoading && "opacity-70"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Figma className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
