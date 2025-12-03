"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, Check, X, RefreshCw, Monitor, Camera, Crosshair } from "lucide-react";

type CaptureType = "normal" | "canvas";

// Presets de tamanho para o seletor
const SIZE_PRESETS = [
  { label: "320×240", width: 320, height: 240 },
  { label: "480×360", width: 480, height: 360 },
  { label: "640×480", width: 640, height: 480 },
  { label: "800×600", width: 800, height: 600 },
  { label: "1024×768", width: 1024, height: 768 },
  { label: "1152×864", width: 1152, height: 864 },
  { label: "1280×960", width: 1280, height: 960 },
];

/**
 * Captura screenshot usando Screen Capture API (nativa do navegador)
 * Captura TUDO que está visível na tela, incluindo WebGL, iframes cross-origin, etc.
 */
async function captureScreenWithDisplayMedia(): Promise<string> {
  console.log("[ScreenCapture] Starting Screen Capture API...");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error("Screen Capture API não disponível neste navegador");
  }

  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
      },
      audio: false,
      // @ts-expect-error - preferCurrentTab é uma API mais recente
      preferCurrentTab: true,
    });

    console.log("[ScreenCapture] Got media stream, capturing frame...");

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error("Não foi possível obter o track de vídeo");
    }

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = () => reject(new Error("Erro ao carregar vídeo"));
      setTimeout(() => reject(new Error("Timeout ao carregar stream")), 5000);
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log(`[ScreenCapture] Video dimensions: ${video.videoWidth}x${video.videoHeight}`);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Não foi possível criar contexto 2D");
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");

    console.log(`[ScreenCapture] Screenshot captured! Size: ${(dataUrl.length / 1024).toFixed(0)}KB`);

    return dataUrl;
  } finally {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
}


interface ScreenCaptureOverlayProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

export function ScreenCaptureOverlay({ onCapture, onCancel }: ScreenCaptureOverlayProps) {
  const [status, setStatus] = useState<"selecting" | "waiting" | "capturing" | "cropping" | "captured" | "error">("selecting");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [captureType, setCaptureType] = useState<CaptureType>("normal");
  const [isCanvasModeActive, setIsCanvasModeActive] = useState(false);

  // Estado do seletor de área
  const [cropArea, setCropArea] = useState({ x: 100, y: 100, width: 1024, height: 768 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });

  // Posição do frame de design detectado (como proporção da viewport)
  const [detectedFrameBounds, setDetectedFrameBounds] = useState<{
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  } | null>(null);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const getProjectId = () => {
    if (typeof window === "undefined") return null;
    const match = window.location.pathname.match(/\/editor\/([^/]+)/);
    return match ? match[1] : null;
  };

  const projectId = getProjectId();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const canvasWrapper = document.querySelector("[data-canvas-wrapper]");
      setIsCanvasModeActive(!!canvasWrapper);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Desenhar a imagem capturada no canvas de preview
  // Esta é a abordagem correta: canvas com dimensões exatas = sem letterboxing
  const drawPreviewCanvas = useCallback(() => {
    if (!capturedImage || !previewCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Dimensões originais da captura
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // Calcular escala para caber na tela (max 1200x700)
      const maxWidth = 1200;
      const maxHeight = 700;
      const scale = Math.min(maxWidth / naturalW, maxHeight / naturalH, 1);

      // Dimensões do canvas de preview
      const previewW = Math.round(naturalW * scale);
      const previewH = Math.round(naturalH * scale);

      // Configurar o canvas com as dimensões exatas
      canvas.width = previewW;
      canvas.height = previewH;
      canvas.style.width = previewW + "px";
      canvas.style.height = previewH + "px";

      // Desenhar a imagem escalada no canvas
      ctx.drawImage(img, 0, 0, previewW, previewH);

      // Salvar a escala para conversão posterior
      setPreviewScale(scale);
      setImageDisplaySize({ width: previewW, height: previewH });
      // Canvas não tem offset interno (diferente de <img> com object-contain)

      console.log("========== CANVAS PREVIEW DEBUG ==========");
      console.log("Natural (pixels reais):", naturalW, "x", naturalH);
      console.log("Preview scale:", scale.toFixed(4));
      console.log("Preview (canvas):", previewW, "x", previewH);
      console.log("==========================================");

      // Posicionar o crop inicial
      if (detectedFrameBounds) {
        // Converter proporções para coordenadas no preview
        const frameX = detectedFrameBounds.xRatio * previewW;
        const frameY = detectedFrameBounds.yRatio * previewH;
        const frameW = detectedFrameBounds.widthRatio * previewW;
        const frameH = detectedFrameBounds.heightRatio * previewH;

        console.log("========== AUTO FRAME DETECTION ==========");
        console.log("Frame ratios:", detectedFrameBounds);
        console.log("Frame on preview:", { x: frameX, y: frameY, w: frameW, h: frameH });
        console.log("==========================================");

        const margin = 4;
        setCropArea({
          x: Math.max(0, frameX - margin),
          y: Math.max(0, frameY - margin),
          width: Math.min(frameW + margin * 2, previewW - frameX + margin),
          height: Math.min(frameH + margin * 2, previewH - frameY + margin),
        });
      } else {
        // Crop inicial centrado (70% da largura, aspect 4:3)
        const cropW = Math.min(800, previewW * 0.7);
        const cropH = cropW * (3 / 4);
        setCropArea({
          x: Math.max(0, (previewW - cropW) / 2),
          y: Math.max(0, (previewH - cropH) / 2),
          width: Math.min(cropW, previewW),
          height: Math.min(cropH, previewH),
        });
      }
    };
    img.src = capturedImage;
  }, [capturedImage, detectedFrameBounds]);

  // Chamar drawPreviewCanvas quando capturedImage mudar
  useEffect(() => {
    if (capturedImage && status === "cropping") {
      drawPreviewCanvas();
    }
  }, [capturedImage, status, drawPreviewCanvas]);

  // Screenshot Normal via API (Puppeteer)
  const captureNormalScreenshot = useCallback(async () => {
    if (!projectId) {
      setError("Não foi possível identificar o projeto");
      setStatus("error");
      return;
    }

    setStatus("capturing");
    setError(null);

    try {
      const response = await fetch("/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao capturar screenshot");
      }

      setCroppedImage(data.screenshot);
      setStatus("captured");

    } catch (err) {
      console.error("Screenshot error:", err);
      setError(err instanceof Error ? err.message : "Erro ao capturar screenshot");
      setStatus("error");
    }
  }, [projectId]);

  // Screenshot Canvas via Screen Capture API
  const captureCanvasScreenshot = useCallback(async () => {
    setStatus("capturing");
    setError(null);

    const overlayElement = document.querySelector("[data-screen-capture-overlay]") as HTMLElement;

    try {
      // ANTES de esconder o overlay, detectar a posição do frame de design
      // Estratégia: Procurar pelo iframe de preview (o conteúdo do design)
      // 1. Primeiro, procurar o container de canvas mode
      // 2. Se encontrar, pegar o primeiro iframe dentro dele (o frame do design)
      // 3. Fallback: procurar qualquer iframe de preview

      let frameElement: Element | null = null;

      const canvasContainer = document.querySelector("[data-canvas-container]");
      if (canvasContainer) {
        // Pegar o container do primeiro frame (não o iframe diretamente, mas seu container)
        // O container do frame tem as dimensões corretas com o zoom aplicado
        const firstFrame = canvasContainer.querySelector("div.relative.overflow-hidden");
        if (firstFrame) {
          frameElement = firstFrame;
        } else {
          // Fallback: pegar o primeiro iframe dentro do container
          frameElement = canvasContainer.querySelector("iframe");
        }
      }

      // Fallback final: modo normal (não canvas mode)
      if (!frameElement) {
        frameElement = document.querySelector("[data-canvas-wrapper] iframe") ||
                       document.querySelector("iframe[title*='Preview']");
      }

      if (frameElement) {
        const frameRect = frameElement.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Salvar como proporções relativas à viewport
        // Isso permite converter para a imagem capturada depois
        const frameBounds = {
          xRatio: frameRect.left / viewportW,
          yRatio: frameRect.top / viewportH,
          widthRatio: frameRect.width / viewportW,
          heightRatio: frameRect.height / viewportH,
        };

        console.log("[ScreenCapture] Frame detected:", {
          element: frameElement.tagName,
          selector: frameElement.className || frameElement.getAttribute("title"),
          rect: { left: frameRect.left, top: frameRect.top, width: frameRect.width, height: frameRect.height },
          viewport: { width: viewportW, height: viewportH },
          ratios: frameBounds,
        });

        setDetectedFrameBounds(frameBounds);
      } else {
        console.log("[ScreenCapture] No design frame detected");
        setDetectedFrameBounds(null);
      }

      // Esconder overlay
      if (overlayElement) {
        overlayElement.style.opacity = "0";
        overlayElement.style.pointerEvents = "none";
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await captureScreenWithDisplayMedia();

      // Mostrar overlay
      if (overlayElement) {
        overlayElement.style.opacity = "1";
        overlayElement.style.pointerEvents = "auto";
      }

      setCapturedImage(dataUrl);
      setStatus("cropping");

      console.log("[ScreenCapture] Canvas captured, showing crop selector...");

    } catch (err) {
      if (overlayElement) {
        overlayElement.style.opacity = "1";
        overlayElement.style.pointerEvents = "auto";
      }

      console.error("Canvas screenshot error:", err);

      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Captura cancelada. Clique em 'Tentar Novamente' e selecione a aba do Chrome.");
      } else {
        setError(err instanceof Error ? err.message : "Erro ao capturar Canvas Mode");
      }
      setStatus("error");
    }
  }, []);

  // Aplicar recorte e finalizar
  // SIMPLES: dividir coordenadas do crop pela escala do preview
  const applyCrop = useCallback(async () => {
    if (!capturedImage) return;

    setStatus("capturing");

    try {
      // Converter coordenadas do preview para coordenadas da imagem original
      // É tão simples quanto: coordenada_natural = coordenada_preview / previewScale
      const naturalCropArea = {
        x: Math.round(cropArea.x / previewScale),
        y: Math.round(cropArea.y / previewScale),
        width: Math.round(cropArea.width / previewScale),
        height: Math.round(cropArea.height / previewScale),
      };

      console.log("========== CROP DEBUG (SIMPLES) ==========");
      console.log("Preview scale:", previewScale.toFixed(4));
      console.log("Crop (preview):", { x: cropArea.x, y: cropArea.y, w: cropArea.width, h: cropArea.height });
      console.log("Crop (natural):", naturalCropArea);
      console.log("==========================================");

      // Carregar imagem original e fazer crop
      const cropped = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = naturalCropArea.width;
          canvas.height = naturalCropArea.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Não foi possível criar contexto 2D"));
            return;
          }

          // Desenhar a região selecionada da imagem original
          ctx.drawImage(
            img,
            naturalCropArea.x,      // sourceX
            naturalCropArea.y,      // sourceY
            naturalCropArea.width,  // sourceWidth
            naturalCropArea.height, // sourceHeight
            0,                      // destX
            0,                      // destY
            naturalCropArea.width,  // destWidth
            naturalCropArea.height  // destHeight
          );

          console.log("Cropped canvas:", canvas.width, "x", canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        };
        img.onerror = () => reject(new Error("Erro ao carregar imagem"));
        img.src = capturedImage;
      });

      setCroppedImage(cropped);
      setStatus("captured");
    } catch (err) {
      console.error("Crop error:", err);
      setError("Erro ao recortar imagem");
      setStatus("error");
    }
  }, [capturedImage, cropArea, previewScale]);

  // Handlers de drag/resize do seletor
  const handleMouseDown = useCallback((e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Usar o canvas como referência para posicionamento (não o container)
    const canvasRect = previewCanvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    if (action === "move") {
      setIsDragging(true);
      // Posição relativa direta ao canvas (sem offset porque canvas não tem letterboxing)
      const mouseXRelativeToCanvas = e.clientX - canvasRect.left;
      const mouseYRelativeToCanvas = e.clientY - canvasRect.top;
      setDragStart({
        x: mouseXRelativeToCanvas - cropArea.x,
        y: mouseYRelativeToCanvas - cropArea.y,
      });
    } else {
      setIsResizing(action);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [cropArea.x, cropArea.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;

    // Usar o canvas como referência para posicionamento
    const canvasRect = previewCanvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    if (isDragging) {
      // Calcular nova posição relativa ao canvas
      const mouseXRelativeToCanvas = e.clientX - canvasRect.left;
      const mouseYRelativeToCanvas = e.clientY - canvasRect.top;

      let newX = mouseXRelativeToCanvas - dragStart.x;
      let newY = mouseYRelativeToCanvas - dragStart.y;

      // Limitar aos bounds da IMAGEM (não do container)
      newX = Math.max(0, Math.min(newX, imageDisplaySize.width - cropArea.width));
      newY = Math.max(0, Math.min(newY, imageDisplaySize.height - cropArea.height));

      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    }

    if (isResizing) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setCropArea(prev => {
        let { x, y, width, height } = prev;

        // Manter aspect ratio 4:3
        const aspectRatio = 4 / 3;

        if (isResizing.includes("e")) {
          width = Math.max(200, prev.width + deltaX);
          height = width / aspectRatio;
        }
        if (isResizing.includes("w")) {
          const newWidth = Math.max(200, prev.width - deltaX);
          const widthDiff = prev.width - newWidth;
          x = prev.x + widthDiff;
          width = newWidth;
          height = width / aspectRatio;
        }
        if (isResizing.includes("s")) {
          height = Math.max(150, prev.height + deltaY);
          width = height * aspectRatio;
        }
        if (isResizing.includes("n")) {
          const newHeight = Math.max(150, prev.height - deltaY);
          const heightDiff = prev.height - newHeight;
          y = prev.y + heightDiff;
          height = newHeight;
          width = height * aspectRatio;
        }

        // Limitar aos bounds da imagem
        if (x < 0) { width += x; x = 0; }
        if (y < 0) { height += y; y = 0; }
        if (x + width > imageDisplaySize.width) width = imageDisplaySize.width - x;
        if (y + height > imageDisplaySize.height) height = imageDisplaySize.height - y;

        return { x, y, width, height };
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, dragStart, imageDisplaySize, cropArea.width, cropArea.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  // Aplicar preset de tamanho
  const applyPreset = useCallback((preset: { width: number; height: number }) => {
    const centerX = (imageDisplaySize.width - preset.width) / 2;
    const centerY = (imageDisplaySize.height - preset.height) / 2;

    setCropArea({
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
      width: Math.min(preset.width, imageDisplaySize.width),
      height: Math.min(preset.height, imageDisplaySize.height),
    });
  }, [imageDisplaySize]);

  // Centralizar seleção
  const centerSelection = useCallback(() => {
    const centerX = (imageDisplaySize.width - cropArea.width) / 2;
    const centerY = (imageDisplaySize.height - cropArea.height) / 2;

    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, centerX),
      y: Math.max(0, centerY),
    }));
  }, [imageDisplaySize, cropArea.width, cropArea.height]);

  const startCapture = useCallback((type: CaptureType) => {
    setCaptureType(type);
    if (type === "canvas") {
      setStatus("waiting");
    } else {
      captureNormalScreenshot();
    }
  }, [captureNormalScreenshot]);

  const startCanvasCapture = useCallback(() => {
    captureCanvasScreenshot();
  }, [captureCanvasScreenshot]);

  useEffect(() => {
    if (mounted && projectId && !isCanvasModeActive) {
      startCapture("normal");
    }
  }, [mounted, projectId, isCanvasModeActive, startCapture]);

  const handleConfirm = useCallback(() => {
    if (croppedImage && status === "captured") {
      onCapture(croppedImage);
    }
  }, [croppedImage, onCapture, status]);

  const handleRecapture = useCallback(() => {
    setCapturedImage(null);
    setCroppedImage(null);
    if (captureType === "canvas") {
      setStatus("waiting");
    } else {
      startCapture(captureType);
    }
  }, [captureType, startCapture]);

  const handleBackToSelection = useCallback(() => {
    setCapturedImage(null);
    setCroppedImage(null);
    setStatus("selecting");
    setError(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (status === "cropping") {
          applyCrop();
        } else if (status === "captured") {
          handleConfirm();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, handleConfirm, applyCrop, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      data-screen-capture-overlay="true"
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col transition-opacity duration-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <p className="text-base text-white text-center font-medium">
          {status === "selecting" && "Escolha o tipo de screenshot"}
          {status === "waiting" && "Pronto para capturar"}
          {status === "capturing" && (captureType === "canvas" ? "Selecione a aba para capturar..." : "Capturando screenshot do projeto...")}
          {status === "cropping" && "Arraste para selecionar a área"}
          {status === "captured" && "Screenshot capturado!"}
          {status === "error" && "Erro ao capturar"}
        </p>
        {status === "cropping" && (
          <p className="text-xs text-white/50 text-center mt-1">
            Arraste os cantos para redimensionar • Arraste o centro para mover • Enter para confirmar
          </p>
        )}
        {status === "captured" && (
          <p className="text-xs text-white/50 text-center mt-1">
            Enter para confirmar • Esc para cancelar
          </p>
        )}
      </div>

      {/* Área principal */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
        {/* Selection Screen */}
        {status === "selecting" && isCanvasModeActive && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Canvas Mode Detectado</h3>
              <p className="text-white/60 max-w-md">
                Você está no Canvas Mode. Escolha qual tipo de screenshot deseja capturar:
              </p>
            </div>

            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => startCapture("normal")}
                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-zinc-700 hover:border-violet-500 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all group w-64"
              >
                <div className="h-16 w-16 rounded-full bg-zinc-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                  <Monitor className="h-8 w-8 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-white mb-1">Screenshot Normal</h4>
                  <p className="text-sm text-white/50">
                    Captura apenas o design HTML sem o background do Canvas Mode
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => startCapture("canvas")}
                className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-zinc-700 hover:border-violet-500 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all group w-64 relative"
              >
                <div className="absolute -top-2 -right-2 bg-violet-500 text-white text-xs px-2 py-0.5 rounded-full">
                  WebGL
                </div>
                <div className="h-16 w-16 rounded-full bg-zinc-800 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                  <Camera className="h-8 w-8 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-white mb-1">Screenshot Canvas</h4>
                  <p className="text-sm text-white/50">
                    Captura a tela completa incluindo Unicorn Studio e efeitos WebGL
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Waiting Screen */}
        {status === "waiting" && (
          <div className="flex flex-col items-center gap-6 text-center max-w-lg">
            <div className="h-20 w-20 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Camera className="h-10 w-10 text-violet-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Captura de Tela</h3>
              <p className="text-white/70 mb-4">
                Ao clicar em &quot;Capturar Agora&quot;, uma janela do navegador vai aparecer.
              </p>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-left space-y-2">
                <p className="text-white/80 text-sm flex items-start gap-2">
                  <span className="bg-violet-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  Selecione a <strong className="text-violet-400">aba do Chrome</strong> com seu projeto
                </p>
                <p className="text-white/80 text-sm flex items-start gap-2">
                  <span className="bg-violet-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  Clique em <strong className="text-violet-400">&quot;Compartilhar&quot;</strong>
                </p>
                <p className="text-white/80 text-sm flex items-start gap-2">
                  <span className="bg-violet-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  Selecione a <strong className="text-violet-400">área desejada</strong> e confirme
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 py-2 bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                onClick={startCanvasCapture}
              >
                <Camera className="mr-2 h-4 w-4" />
                Capturar Agora
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors"
                onClick={handleBackToSelection}
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* Capturing */}
        {status === "capturing" && (
          <div className="flex flex-col items-center gap-4 text-white/70">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p>{captureType === "canvas" ? "Aguardando seleção da aba..." : "Gerando screenshot automaticamente..."}</p>
          </div>
        )}

        {/* Cropping - Seletor de área */}
        {status === "cropping" && capturedImage && (
          <div className="flex flex-col items-center gap-4 w-full h-full">
            {/* Presets de tamanho */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {SIZE_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    cropArea.width === preset.width && cropArea.height === preset.height
                      ? "bg-violet-500 border-violet-500 text-white"
                      : "border-zinc-600 text-white/70 hover:bg-zinc-800 hover:border-zinc-500"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={centerSelection}
                className="px-3 py-1.5 text-xs rounded-md border border-zinc-600 text-white/70 hover:bg-zinc-800 hover:border-zinc-500 transition-colors flex items-center gap-1"
              >
                <Crosshair className="h-3 w-3" />
                Centralizar
              </button>
            </div>

            {/* Imagem com seletor */}
            <div
              ref={imageContainerRef}
              className="relative flex-1 flex items-center justify-center max-h-[calc(100vh-280px)] overflow-visible"
            >
              {/* Wrapper relativo para o canvas e o overlay */}
              <div className="relative" style={{ width: imageDisplaySize.width || "auto", height: imageDisplaySize.height || "auto" }}>
                {/* Canvas com dimensões exatas = sem letterboxing = coordenadas simples */}
                <canvas
                  ref={previewCanvasRef}
                  className="block"
                />

                {/* Overlay de crop posicionado diretamente sobre o canvas */}
                {imageDisplaySize.width > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                  >
                  {/* Overlay escuro fora da seleção usando clip-path */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: "rgba(0,0,0,0.7)",
                      clipPath: `polygon(
                        0 0,
                        100% 0,
                        100% 100%,
                        0 100%,
                        0 0,
                        ${cropArea.x}px ${cropArea.y}px,
                        ${cropArea.x}px ${cropArea.y + cropArea.height}px,
                        ${cropArea.x + cropArea.width}px ${cropArea.y + cropArea.height}px,
                        ${cropArea.x + cropArea.width}px ${cropArea.y}px,
                        ${cropArea.x}px ${cropArea.y}px
                      )`,
                    }}
                  />

                  {/* Área de seleção */}
                  <div
                    className="absolute border-2 border-violet-500 cursor-move pointer-events-auto"
                    style={{
                      left: cropArea.x,
                      top: cropArea.y,
                      width: cropArea.width,
                      height: cropArea.height,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, "move")}
                  >
                    {/* Dimensões */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                    </div>

                    {/* Handles de redimensionamento */}
                    {/* Cantos */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-violet-500 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "nw")} />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-violet-500 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "ne")} />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-violet-500 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "sw")} />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-violet-500 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "se")} />

                    {/* Bordas */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-violet-500 cursor-n-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "n")} />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border-2 border-violet-500 cursor-s-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "s")} />
                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-violet-500 cursor-w-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "w")} />
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border-2 border-violet-500 cursor-e-resize pointer-events-auto" onMouseDown={(e) => handleMouseDown(e, "e")} />
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-6 text-center max-w-lg">
            <div className="h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Erro ao Capturar</h3>
              <p className="text-white/70">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors"
                onClick={handleRecapture}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </button>
              {isCanvasModeActive && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors"
                  onClick={handleBackToSelection}
                >
                  Outro tipo
                </button>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-transparent text-white/70 hover:bg-white/10 transition-colors"
                onClick={onCancel}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Captured */}
        {status === "captured" && croppedImage && (
          <div className="relative">
            <img
              src={croppedImage}
              alt="Screenshot"
              className="max-w-full max-h-[calc(100vh-200px)] rounded-lg shadow-2xl border border-zinc-700"
            />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/50">
              {(croppedImage.length * 0.75 / 1024).toFixed(0)} KB
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 bg-zinc-900 border-t border-zinc-700">
        {status === "selecting" && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-transparent text-white/70 hover:bg-white/10 transition-colors"
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </button>
        )}

        {status === "waiting" && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-transparent text-white/70 hover:bg-white/10 transition-colors"
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </button>
        )}

        {status === "capturing" && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-transparent text-white/70 hover:bg-white/10 transition-colors"
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </button>
        )}

        {status === "cropping" && (
          <>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors"
              onClick={handleRecapture}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recapturar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 py-2 bg-violet-500 text-white hover:bg-violet-600 transition-colors"
              onClick={applyCrop}
            >
              <Check className="mr-2 h-4 w-4" />
              Capturar (Enter)
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-transparent text-white/70 hover:bg-white/10 transition-colors"
              onClick={onCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar (Esc)
            </button>
          </>
        )}

        {status === "captured" && (
          <>
            {isCanvasModeActive && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors"
                onClick={handleBackToSelection}
              >
                Outro tipo
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors"
              onClick={handleRecapture}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recapturar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors"
              onClick={handleConfirm}
            >
              <Check className="mr-2 h-4 w-4" />
              Usar Screenshot
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-transparent text-white/70 hover:bg-white/10 transition-colors"
              onClick={onCancel}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
