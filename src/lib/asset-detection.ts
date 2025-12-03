import type { DetectedAsset, DetectedAssetType } from "@/types";

/**
 * Detects all image and video assets in a document.
 * Scans for: <img> tags, <video> tags, and background-image CSS properties.
 */
export function detectAssetsInDocument(doc: Document): DetectedAsset[] {
  const assets: DetectedAsset[] = [];
  let instanceCounter = 0;

  // 1. Detect <img> tags
  doc.querySelectorAll("img").forEach((img) => {
    const src = img.src || img.getAttribute("data-src");
    if (src && !src.startsWith("data:") && src.trim() !== "") {
      instanceCounter++;
      assets.push({
        id: `asset-${instanceCounter}`,
        type: "img",
        src,
        alt: img.alt || undefined,
        elementId: img.getAttribute("data-buildix-id") || `img-${instanceCounter}`,
        instanceNumber: instanceCounter,
        tagName: "img",
      });
    }
  });

  // 2. Detect <video> tags
  doc.querySelectorAll("video").forEach((video) => {
    const src = video.src || video.querySelector("source")?.getAttribute("src");
    if (src && src.trim() !== "") {
      instanceCounter++;
      assets.push({
        id: `asset-${instanceCounter}`,
        type: "video",
        src,
        elementId: video.getAttribute("data-buildix-id") || `video-${instanceCounter}`,
        instanceNumber: instanceCounter,
        tagName: "video",
      });
    }
  });

  // 3. Detect background-image CSS (inline styles)
  doc.querySelectorAll("[style*='background']").forEach((el) => {
    const htmlEl = el as HTMLElement;
    const style = htmlEl.style.backgroundImage;
    if (style && style !== "none") {
      const urlMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (urlMatch?.[1] && !urlMatch[1].startsWith("data:")) {
        instanceCounter++;
        assets.push({
          id: `asset-${instanceCounter}`,
          type: "background",
          src: urlMatch[1],
          elementId: el.getAttribute("data-buildix-id") || `bg-${instanceCounter}`,
          instanceNumber: instanceCounter,
          tagName: el.tagName.toLowerCase(),
        });
      }
    }
  });

  // 4. Also check computed styles for background images from CSS classes
  const allElements = doc.querySelectorAll("*");
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Skip if already detected via inline style
    if (htmlEl.style.backgroundImage && htmlEl.style.backgroundImage !== "none") {
      return;
    }

    try {
      const computed = doc.defaultView?.getComputedStyle(htmlEl);
      if (computed?.backgroundImage && computed.backgroundImage !== "none") {
        const urlMatch = computed.backgroundImage.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (urlMatch?.[1] && !urlMatch[1].startsWith("data:")) {
          // Check if this URL was already added
          const alreadyAdded = assets.some(a => a.src === urlMatch[1]);
          if (!alreadyAdded) {
            instanceCounter++;
            assets.push({
              id: `asset-${instanceCounter}`,
              type: "background",
              src: urlMatch[1],
              elementId: el.getAttribute("data-buildix-id") || `bg-computed-${instanceCounter}`,
              instanceNumber: instanceCounter,
              tagName: el.tagName.toLowerCase(),
            });
          }
        }
      }
    } catch {
      // Ignore errors from cross-origin styles
    }
  });

  return assets;
}

/**
 * Updates an asset's source in the document.
 * Returns true if the update was successful.
 */
export function updateAssetInDocument(
  doc: Document,
  asset: DetectedAsset,
  newSrc: string
): boolean {
  // Try to find by data-buildix-id first
  let element = doc.querySelector(`[data-buildix-id="${asset.elementId}"]`);

  // Fallback: find by current src
  if (!element) {
    if (asset.type === "img") {
      element = doc.querySelector(`img[src="${asset.src}"]`);
    } else if (asset.type === "video") {
      element = doc.querySelector(`video[src="${asset.src}"]`) ||
                doc.querySelector(`video source[src="${asset.src}"]`)?.parentElement;
    }
  }

  if (!element) return false;

  switch (asset.type) {
    case "img":
      (element as HTMLImageElement).src = newSrc;
      // Also update srcset if present
      if ((element as HTMLImageElement).srcset) {
        (element as HTMLImageElement).srcset = "";
      }
      break;

    case "video":
      const video = element as HTMLVideoElement;
      video.src = newSrc;
      // Also update source element if present
      const source = video.querySelector("source");
      if (source) {
        source.setAttribute("src", newSrc);
      }
      // Reload the video
      video.load();
      break;

    case "background":
      (element as HTMLElement).style.backgroundImage = `url('${newSrc}')`;
      break;
  }

  return true;
}

/**
 * Gets a display label for the asset type
 */
export function getAssetTypeLabel(type: DetectedAssetType): string {
  switch (type) {
    case "img":
      return "Image Tag";
    case "video":
      return "Video";
    case "background":
      return "Background";
  }
}
