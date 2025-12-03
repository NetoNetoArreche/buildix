"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ComponentPreviewTooltipProps {
  code: string;
  children: React.ReactNode;
}

export function ComponentPreviewTooltip({ code, children }: ComponentPreviewTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const previewWidth = 400;
    const previewHeight = 280;

    let x: number;
    let y: number;

    // Posicionar horizontalmente - preferir à direita do modal (fora dele)
    if (rect.right + previewWidth + 20 < viewportWidth) {
      // Cabe à direita
      x = rect.right + 12;
    } else if (rect.left - previewWidth - 20 > 0) {
      // Cabe à esquerda
      x = rect.left - previewWidth - 12;
    } else {
      // Posicionar acima ou abaixo
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

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    clearTimeout(timeoutRef.current);
    const target = e.currentTarget;
    timeoutRef.current = setTimeout(() => {
      calculatePosition(target);
      setIsHovered(true);
    }, 300);
  }, [calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsHovered(false);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Injetar HTML no iframe
  useEffect(() => {
    if (isHovered && iframeRef.current) {
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
                overflow: hidden;
                background: #09090b;
                min-height: 100vh;
              }
              ::-webkit-scrollbar { display: none; }
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
  }, [isHovered, code]);

  const previewContent = isHovered && mounted ? (
    <div
      className="fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: position.x,
        top: position.y,
        width: 400,
        height: 280,
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
            pointerEvents: "none",
            border: "none",
          }}
          sandbox="allow-same-origin allow-scripts"
          title="Component Preview"
        />
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full"
    >
      {children}
      {mounted && previewContent && createPortal(previewContent, document.body)}
    </div>
  );
}
