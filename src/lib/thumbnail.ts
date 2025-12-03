"use client";

import { toPng } from "html-to-image";

// Thumbnail dimensions for project cards (16:9 aspect ratio)
const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_HEIGHT = 360;

/**
 * Generate a thumbnail from the current iframe preview
 * Captures the FULL content and scales it down to fit the thumbnail
 * Returns a base64 data URL of the thumbnail image
 */
export async function generateThumbnail(): Promise<string | null> {
  const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
  if (!iframe?.contentDocument?.body) {
    console.log("[Thumbnail] No iframe found");
    return null;
  }

  // For landing pages, capture the body. For Instagram content, capture first element
  const body = iframe.contentDocument.body;
  const firstElement = body.firstElementChild as HTMLElement;

  // Determine content type and what to capture
  const isInstagramContent = body.innerHTML.includes('w-[1080px]') ||
                             body.innerHTML.includes('carousel-slide');

  // For Instagram content (post, story, carousel), capture the first slide/element
  // For landing pages, capture a viewport-sized screenshot of the body
  const elementToCapture = isInstagramContent ? firstElement : body;

  if (!elementToCapture) {
    console.log("[Thumbnail] No content found to capture");
    return null;
  }

  try {
    // Get the actual dimensions of the content
    const contentWidth = elementToCapture.scrollWidth || elementToCapture.offsetWidth;
    const contentHeight = elementToCapture.scrollHeight || elementToCapture.offsetHeight;

    console.log("[Thumbnail] Content dimensions:", contentWidth, "x", contentHeight);

    // For landing pages, limit the height to create a "preview" view (like first screen)
    // For Instagram, capture the full content (single slide)
    let captureWidth = contentWidth;
    let captureHeight = contentHeight;

    if (!isInstagramContent) {
      // For landing pages, capture approximately 16:9 aspect of the top
      // This gives a "hero section" preview
      captureHeight = Math.min(contentHeight, Math.round(contentWidth * 0.5625)); // 16:9
    }

    // Calculate scale to fit within thumbnail while maintaining aspect ratio
    const scaleX = THUMBNAIL_WIDTH / captureWidth;
    const scaleY = THUMBNAIL_HEIGHT / captureHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Never scale up

    // Final thumbnail dimensions
    const finalWidth = Math.round(captureWidth * scale);
    const finalHeight = Math.round(captureHeight * scale);

    console.log("[Thumbnail] Generating at:", finalWidth, "x", finalHeight, "scale:", scale);

    // Generate the thumbnail
    const dataUrl = await toPng(elementToCapture, {
      width: captureWidth,
      height: captureHeight,
      pixelRatio: scale, // This effectively scales down the image
      backgroundColor: "#18181b", // zinc-900
      style: {
        // Ensure we capture from top-left
        transform: "none",
        transformOrigin: "top left",
      },
      // Skip problematic elements
      filter: (node) => {
        // Skip iframes within the content
        if (node.tagName === 'IFRAME') return false;
        return true;
      },
    });

    console.log("[Thumbnail] Generated successfully, size:", Math.round(dataUrl.length / 1024), "KB");
    return dataUrl;
  } catch (error) {
    console.error("[Thumbnail] Generation failed:", error);
    return null;
  }
}

/**
 * Generate thumbnail with a delay to ensure iframe has rendered
 */
export async function generateThumbnailWithDelay(delayMs: number = 500): Promise<string | null> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const thumbnail = await generateThumbnail();
      resolve(thumbnail);
    }, delayMs);
  });
}
