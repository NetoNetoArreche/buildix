"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ComponentPreviewTooltipProps {
  code: string;
  children: React.ReactNode;
}

export function ComponentPreviewTooltip({ code, children }: ComponentPreviewTooltipProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTriggerRect(rect);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const previewWidth = 400;
    const previewHeight = 280;

    let x: number;
    let y: number;

    // Posicionar horizontalmente - preferir à direita do modal (fora dele)
    if (rect.right + previewWidth + 20 < viewportWidth) {
      x = rect.right + 12;
    } else if (rect.left - previewWidth - 20 > 0) {
      x = rect.left - previewWidth - 12;
    } else {
      x = Math.max(10, rect.left);
    }

    // Posicionar verticalmente - centralizar com o card
    y = rect.top + (rect.height / 2) - (previewHeight / 2);

    // Ajustar se sair da tela
    if (y + previewHeight > viewportHeight - 20) {
      y = viewportHeight - previewHeight - 20;
    }
    if (y < 10) y = 10;

    setPosition({ x, y });
  }, []);

  const handleTriggerEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }

    const target = e.currentTarget;
    openTimeoutRef.current = setTimeout(() => {
      calculatePosition(target);
      setShowPreview(true);
    }, 300);
  }, [calculatePosition]);

  const handleTriggerLeave = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    // Delay para dar tempo de entrar no container do portal
    closeTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 150);
  }, []);

  // Handler para o container do portal (bridge + preview)
  const handleContainerEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleContainerLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Injetar HTML no iframe
  useEffect(() => {
    if (showPreview && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                overflow: auto;
                background: #09090b;
                min-height: 100vh;
              }
              ::-webkit-scrollbar { width: 8px; height: 8px; }
              ::-webkit-scrollbar-track { background: #18181b; }
              ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
              ::-webkit-scrollbar-thumb:hover { background: #52525b; }
            </style>
          </head>
          <body>
            ${code}
          </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [showPreview, code]);

  // Calcular dimensões do container que engloba bridge + preview
  // O container cobre toda a área desde o trigger até o preview para evitar gaps
  const getContainerStyle = () => {
    if (!triggerRect) return null;

    const previewWidth = 400;
    const previewHeight = 280;
    const viewportWidth = window.innerWidth;

    const isRight = triggerRect.right + previewWidth + 20 < viewportWidth;

    // Calcular área total que precisa ser coberta (do trigger até o preview)
    const minY = Math.min(triggerRect.top, position.y);
    const maxY = Math.max(triggerRect.bottom, position.y + previewHeight);
    const totalHeight = maxY - minY;

    // Offset do preview dentro do container
    const previewOffsetY = position.y - minY;

    if (isRight) {
      // Preview à direita do trigger
      const bridgeWidth = Math.max(0, position.x - triggerRect.right);
      return {
        position: 'fixed' as const,
        left: triggerRect.right,
        top: minY,
        width: bridgeWidth + previewWidth,
        height: totalHeight,
        zIndex: 9999,
        isRight: true,
        bridgeWidth,
        previewOffsetY,
      };
    } else {
      // Preview à esquerda do trigger
      const bridgeWidth = Math.max(0, triggerRect.left - (position.x + previewWidth));
      return {
        position: 'fixed' as const,
        left: position.x,
        top: minY,
        width: previewWidth + bridgeWidth,
        height: totalHeight,
        zIndex: 9999,
        isRight: false,
        bridgeWidth,
        previewOffsetY,
      };
    }
  };

  const containerStyle = getContainerStyle();

  const portalContent = showPreview && mounted && containerStyle ? (
    <div
      ref={containerRef}
      style={{
        position: containerStyle.position,
        left: containerStyle.left,
        top: containerStyle.top,
        width: containerStyle.width,
        height: containerStyle.height,
        zIndex: containerStyle.zIndex,
      }}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
    >
      {/* Preview posicionado com offset correto */}
      <div
        className="absolute bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          width: 400,
          height: 280,
          top: containerStyle.previewOffsetY,
          right: containerStyle.isRight ? 0 : 'auto',
          left: containerStyle.isRight ? 'auto' : 0,
        }}
      >
        {/* Header */}
        <div className="h-7 bg-zinc-800 border-b border-zinc-700 flex items-center px-3 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="text-[10px] text-zinc-500 ml-2">Preview</span>
        </div>
        {/* Iframe Container */}
        <div className="relative overflow-hidden" style={{ height: 253 }}>
          <iframe
            ref={iframeRef}
            className="absolute top-0 left-0 origin-top-left bg-zinc-950"
            style={{
              width: 1440,
              height: 900,
              transform: "scale(0.278)",
              border: "none",
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="Component Preview"
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleTriggerEnter}
      onMouseLeave={handleTriggerLeave}
      className="w-full"
    >
      {children}
      {mounted && portalContent && createPortal(portalContent, document.body)}
    </div>
  );
}
