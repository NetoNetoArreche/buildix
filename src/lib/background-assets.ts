import type { BackgroundAsset } from "@/types";

// Generate alpha mask gradient CSS
function getAlphaMaskGradient(type: string, intensity: number): string {
  const alpha = intensity / 100;
  switch (type) {
    case "top":
      return `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${alpha}) ${intensity}%)`;
    case "bottom":
      return `linear-gradient(to top, transparent 0%, rgba(0,0,0,${alpha}) ${intensity}%)`;
    case "left":
      return `linear-gradient(to right, transparent 0%, rgba(0,0,0,${alpha}) ${intensity}%)`;
    case "right":
      return `linear-gradient(to left, transparent 0%, rgba(0,0,0,${alpha}) ${intensity}%)`;
    case "radial":
      return `radial-gradient(ellipse at center, rgba(0,0,0,${alpha}) 0%, transparent ${intensity}%)`;
    default:
      return "none";
  }
}

// Generate HTML for a single background asset
export function generateAssetHtml(asset: BackgroundAsset): string {
  // Build CSS filters
  const filters: string[] = [];
  if (asset.hue !== 0) filters.push(`hue-rotate(${asset.hue}deg)`);
  if (asset.saturation !== 100) filters.push(`saturate(${asset.saturation}%)`);
  if (asset.brightness !== 100) filters.push(`brightness(${asset.brightness}%)`);
  if (asset.blur > 0) filters.push(`blur(${asset.blur}px)`);
  if (asset.invert) filters.push("invert(100%)");

  // Base styles for container
  const containerStyles = [
    `position: ${asset.position}`,
    "top: 0",
    "left: 0",
    `width: ${asset.width}`,
    `height: ${asset.height}`,
    `z-index: ${asset.zIndex}`,
    `pointer-events: ${asset.pointerEvents}`,
    `opacity: ${asset.opacity / 100}`,
    `mix-blend-mode: ${asset.blendMode}`,
    filters.length > 0 ? `filter: ${filters.join(" ")}` : "",
    "overflow: hidden",
  ].filter(Boolean).join("; ");

  // Color overlay (escurece só a imagem, não afeta elementos por cima)
  let overlayHtml = "";
  if (asset.overlay?.enabled) {
    const overlayColor = asset.overlay.color || "#000000";
    const overlayOpacity = (asset.overlay.opacity ?? 50) / 100;
    overlayHtml = `<div style="position: absolute; inset: 0; background-color: ${overlayColor}; opacity: ${overlayOpacity}; pointer-events: none;"></div>`;
  }

  // Alpha mask overlay (if enabled)
  let alphaMaskHtml = "";
  if (asset.alphaMask?.enabled && asset.alphaMask.type !== "none") {
    const gradient = getAlphaMaskGradient(asset.alphaMask.type, asset.alphaMask.intensity);
    alphaMaskHtml = `<div style="position: absolute; inset: 0; pointer-events: none; -webkit-mask-image: ${gradient}; mask-image: ${gradient};"></div>`;
  }

  // Generate content based on asset type
  let contentHtml = "";

  switch (asset.type) {
    case "image":
      contentHtml = `<img src="${asset.src}" alt="" style="width: 100%; height: 100%; object-fit: ${asset.objectFit};" />`;
      break;

    case "video":
      contentHtml = `<video src="${asset.src}" ${asset.autoplay ? "autoplay" : ""} ${asset.loop ? "loop" : ""} ${asset.muted ? "muted" : ""} playsinline style="width: 100%; height: 100%; object-fit: ${asset.objectFit};"></video>`;
      break;

    case "embed":
      if (asset.embedType === "unicorn" || asset.embedType === "spline") {
        // Iframe embed
        contentHtml = `<iframe src="${asset.src}" frameborder="0" style="width: 100%; height: 100%; border: none;"></iframe>`;
      } else if (asset.embedCode) {
        // Custom embed code
        contentHtml = asset.embedCode;
      } else {
        contentHtml = `<iframe src="${asset.src}" frameborder="0" style="width: 100%; height: 100%; border: none;"></iframe>`;
      }
      break;
  }

  return `<div data-buildix-bg-asset="${asset.id}" style="${containerStyles}">${contentHtml}${overlayHtml}${alphaMaskHtml}</div>`;
}

// Inject background assets HTML into the page HTML
export function injectBackgroundAssets(html: string, assets: BackgroundAsset[]): string {
  // STEP 1: Remove existing background assets from HTML
  // Remove everything between <!-- Background Assets --> and <!-- End Background Assets -->
  let cleanHtml = html.replace(/<!-- Background Assets -->[\s\S]*?<!-- End Background Assets -->\n?/g, '');

  // Also remove any orphaned data-buildix-bg-asset elements (that might have been saved without comments)
  cleanHtml = cleanHtml.replace(/<div data-buildix-bg-asset="[^"]*"[^>]*>[\s\S]*?<\/div>\n?/g, '');

  // STEP 2: If no new assets, return clean HTML
  if (!assets || assets.length === 0) return cleanHtml;

  // STEP 3: Generate HTML for all visible assets
  const assetsHtml = assets
    .map(asset => generateAssetHtml(asset))
    .join("\n");

  // STEP 4: Find the opening <body> tag and inject assets right after it
  const bodyMatch = cleanHtml.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const bodyTag = bodyMatch[0];
    const bodyIndex = cleanHtml.indexOf(bodyTag) + bodyTag.length;
    return cleanHtml.slice(0, bodyIndex) + "\n<!-- Background Assets -->\n" + assetsHtml + "\n<!-- End Background Assets -->\n" + cleanHtml.slice(bodyIndex);
  }

  // If no body tag found, just return clean HTML
  return cleanHtml;
}
