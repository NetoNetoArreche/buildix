"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Shield, FileText } from "lucide-react";

interface AITermsModalProps {
  open: boolean;
  onAccept: () => void;
}

export function AITermsModal({ open, onAccept }: AITermsModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;

    setLoading(true);
    try {
      const response = await fetch("/api/user/ai-terms", { method: "POST" });
      if (response.ok) {
        onAccept();
      }
    } catch (error) {
      console.error("Failed to accept AI terms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            Termos de Uso - Recursos de IA
          </DialogTitle>
          <DialogDescription className="text-sm">
            Por favor, leia e aceite os termos antes de utilizar os recursos de IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <p className="text-sm text-foreground font-medium">
              Ao utilizar funcionalidades de IA (geração de HTML, imagens, etc.),
              você reconhece que:
            </p>

            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <span>O serviço foi efetivamente prestado e consumido no momento do uso</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <span>Os custos de processamento de IA são irreversíveis e não reembolsáveis</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <span>
                  O direito de arrependimento não se aplica a serviços digitais já executados,
                  conforme Art. 49, parágrafo único do Código de Defesa do Consumidor (CDC)
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Política de Reembolso:</strong>{" "}
                Reembolsos podem ser solicitados em até 7 dias apenas se{" "}
                <strong className="text-foreground">nenhuma funcionalidade de IA</strong>{" "}
                tiver sido utilizada durante o período.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3 py-2">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-relaxed cursor-pointer select-none"
          >
            Li e aceito os termos de uso dos recursos de IA do Buildix
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Salvando...
              </>
            ) : (
              "Aceitar e Continuar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
