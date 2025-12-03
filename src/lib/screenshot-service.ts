/**
 * Cliente para o Screenshot Service externo
 *
 * Em desenvolvimento: usa Puppeteer local
 * Em produção: chama o serviço externo na VPS
 */

const SCREENSHOT_SERVICE_URL = process.env.SCREENSHOT_SERVICE_URL;

interface ScreenshotResult {
  success: boolean;
  screenshot: string;
  size?: {
    width: number;
    height: number;
  };
}

interface IframeScreenshotResult {
  success: boolean;
  screenshots: Record<string, string>;
}

interface CanvasData {
  frames: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    html: string;
    cornerRadius?: number;
    boxShadow?: string;
    filter?: string;
  }>;
  background?: {
    color?: string;
    image?: string;
    filters?: {
      blur?: number;
      hue?: number;
      saturation?: number;
      brightness?: number;
      opacity?: number;
    };
  };
  width?: number;
  height?: number;
}

/**
 * Verifica se o serviço externo está disponível
 */
export function isExternalServiceAvailable(): boolean {
  return !!SCREENSHOT_SERVICE_URL;
}

/**
 * Captura screenshot de HTML
 */
export async function captureScreenshot(data: {
  html: string;
  width?: number;
  height?: number;
  mode?: "normal" | "canvas";
  canvasData?: CanvasData;
}): Promise<ScreenshotResult> {
  if (!SCREENSHOT_SERVICE_URL) {
    throw new Error("Screenshot service not configured. Set SCREENSHOT_SERVICE_URL environment variable.");
  }

  const response = await fetch(`${SCREENSHOT_SERVICE_URL}/screenshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Screenshot failed");
  }

  return response.json();
}

/**
 * Captura screenshots de iframes (Unicorn Studio, Spline, etc.)
 */
export async function captureIframeScreenshots(urls: string[]): Promise<IframeScreenshotResult> {
  if (!SCREENSHOT_SERVICE_URL) {
    throw new Error("Screenshot service not configured. Set SCREENSHOT_SERVICE_URL environment variable.");
  }

  const response = await fetch(`${SCREENSHOT_SERVICE_URL}/iframe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Iframe screenshot failed");
  }

  return response.json();
}

/**
 * Verifica a saúde do serviço
 */
export async function checkServiceHealth(): Promise<boolean> {
  if (!SCREENSHOT_SERVICE_URL) {
    return false;
  }

  try {
    const response = await fetch(`${SCREENSHOT_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
