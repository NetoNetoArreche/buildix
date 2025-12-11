/**
 * Figma Image Processor
 * Preprocesses HTML to ensure all images are accessible for Figma export
 * - Converts blob URLs to base64 (client-side)
 * - Converts external URLs to base64 via server proxy (bypasses CORS)
 * - Converts relative URLs to absolute
 */

export interface ImageProcessingResult {
  html: string;
  processedImages: number;
  failedImages: string[];
  warnings: string[];
}

/**
 * Check if a URL is a blob URL
 */
function isBlobUrl(url: string): boolean {
  return url.startsWith("blob:");
}

/**
 * Check if a URL is a relative URL
 */
function isRelativeUrl(url: string): boolean {
  return (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("data:")
  );
}

/**
 * Check if a URL is a data URL (base64)
 */
function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}

/**
 * Convert a blob URL to base64 data URL (client-side only)
 */
async function convertBlobToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[FigmaImageProcessor] Failed to fetch blob: ${url}`);
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`[FigmaImageProcessor] Error converting blob to base64: ${url}`, error);
    return null;
  }
}

/**
 * Convert external URLs to base64 via server proxy (bypasses CORS)
 */
async function convertExternalUrlsViaProxy(urls: string[]): Promise<Record<string, string | null>> {
  try {
    const response = await fetch("/api/images/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      console.warn(`[FigmaImageProcessor] Proxy API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    return data.results || {};
  } catch (error) {
    console.warn(`[FigmaImageProcessor] Error calling proxy API:`, error);
    return {};
  }
}

/**
 * Convert relative URL to absolute URL
 */
function toAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

/**
 * Extract all image URLs from HTML (both <img> src and CSS background-image)
 */
function extractImageUrls(html: string): { url: string; type: "src" | "background" }[] {
  const images: { url: string; type: "src" | "background" }[] = [];

  // Extract <img> src attributes
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgSrcRegex.exec(html)) !== null) {
    images.push({ url: match[1], type: "src" });
  }

  // Extract CSS background-image URLs
  const bgImageRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImageRegex.exec(html)) !== null) {
    images.push({ url: match[1], type: "background" });
  }

  // Extract inline style background-image
  const styleRegex = /style=["'][^"']*background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)[^"']*["']/gi;
  while ((match = styleRegex.exec(html)) !== null) {
    images.push({ url: match[1], type: "background" });
  }

  return images;
}

/**
 * Replace image URL in HTML
 */
function replaceImageUrl(html: string, oldUrl: string, newUrl: string): string {
  // Escape special regex characters in the URL
  const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Replace in <img> src
  html = html.replace(
    new RegExp(`(<img[^>]+src=["'])${escapedOldUrl}(["'])`, "gi"),
    `$1${newUrl}$2`
  );

  // Replace in CSS background-image
  html = html.replace(
    new RegExp(`(background(?:-image)?:\\s*url\\(["']?)${escapedOldUrl}(["']?\\))`, "gi"),
    `$1${newUrl}$2`
  );

  return html;
}

/**
 * Process HTML to prepare images for Figma export
 * - Converts blob URLs to base64 (client-side)
 * - Converts external URLs to base64 via server proxy (bypasses CORS)
 * - Converts relative URLs to absolute
 */
export async function preprocessHtmlForFigma(
  html: string,
  options: {
    baseUrl?: string;
    convertBlobsToBase64?: boolean;
    convertRelativeToAbsolute?: boolean;
    convertExternalToBase64?: boolean;
  } = {}
): Promise<ImageProcessingResult> {
  const {
    baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    convertBlobsToBase64 = true,
    convertRelativeToAbsolute = true,
    convertExternalToBase64 = true,
  } = options;

  const result: ImageProcessingResult = {
    html,
    processedImages: 0,
    failedImages: [],
    warnings: [],
  };

  const images = extractImageUrls(html);
  const processedUrls = new Set<string>();
  const blobUrls: string[] = [];
  const externalUrls: string[] = [];

  console.log(`[FigmaImageProcessor] Found ${images.length} images to process`);

  // First pass: categorize URLs and handle simple cases
  for (const { url } of images) {
    if (processedUrls.has(url)) continue;
    processedUrls.add(url);

    // Skip data URLs (already base64)
    if (isDataUrl(url)) {
      result.processedImages++;
      continue;
    }

    // Collect blob URLs for client-side conversion
    if (isBlobUrl(url) && convertBlobsToBase64) {
      blobUrls.push(url);
      continue;
    }

    // Handle relative URLs - convert to absolute immediately
    if (isRelativeUrl(url) && convertRelativeToAbsolute) {
      const absoluteUrl = toAbsoluteUrl(url, baseUrl);
      result.html = replaceImageUrl(result.html, url, absoluteUrl);
      // Add the absolute URL to external URLs for proxy conversion
      if (convertExternalToBase64) {
        externalUrls.push(absoluteUrl);
      } else {
        result.processedImages++;
      }
      continue;
    }

    // Collect external URLs for server-side proxy conversion
    if (convertExternalToBase64 && (url.startsWith("http://") || url.startsWith("https://"))) {
      externalUrls.push(url);
      continue;
    }

    result.processedImages++;
  }

  // Second pass: convert blob URLs client-side
  if (blobUrls.length > 0) {
    console.log(`[FigmaImageProcessor] Converting ${blobUrls.length} blob URLs to base64...`);
    for (const url of blobUrls) {
      const base64 = await convertBlobToBase64(url);
      if (base64) {
        result.html = replaceImageUrl(result.html, url, base64);
        result.processedImages++;
      } else {
        result.failedImages.push(url);
        result.warnings.push(`Failed to convert blob URL: ${url.substring(0, 50)}...`);
      }
    }
  }

  // Third pass: convert external URLs via server proxy (bypasses CORS)
  if (externalUrls.length > 0) {
    console.log(`[FigmaImageProcessor] Converting ${externalUrls.length} external URLs via proxy...`);
    const proxyResults = await convertExternalUrlsViaProxy(externalUrls);

    for (const url of externalUrls) {
      const base64 = proxyResults[url];
      if (base64) {
        result.html = replaceImageUrl(result.html, url, base64);
        result.processedImages++;
        console.log(`[FigmaImageProcessor] Converted: ${url.substring(0, 60)}...`);
      } else {
        result.failedImages.push(url);
        result.warnings.push(`Failed to convert external URL: ${url.substring(0, 60)}...`);
        console.warn(`[FigmaImageProcessor] Failed: ${url}`);
      }
    }
  }

  console.log(`[FigmaImageProcessor] Processed ${result.processedImages} images, ${result.failedImages.length} failed`);

  return result;
}

/**
 * Quick validation to check if HTML has problematic image URLs
 */
export function hasProblematicUrls(html: string): {
  hasBlobUrls: boolean;
  hasRelativeUrls: boolean;
  hasExternalUrls: boolean;
  blobUrls: string[];
  relativeUrls: string[];
  externalUrls: string[];
} {
  const images = extractImageUrls(html);
  const blobUrls: string[] = [];
  const relativeUrls: string[] = [];
  const externalUrls: string[] = [];

  for (const { url } of images) {
    if (isBlobUrl(url)) {
      blobUrls.push(url);
    } else if (isRelativeUrl(url)) {
      relativeUrls.push(url);
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      externalUrls.push(url);
    }
  }

  return {
    hasBlobUrls: blobUrls.length > 0,
    hasRelativeUrls: relativeUrls.length > 0,
    hasExternalUrls: externalUrls.length > 0,
    blobUrls,
    relativeUrls,
    externalUrls,
  };
}
