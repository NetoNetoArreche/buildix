import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the preview iframe element.
 * Works in both normal mode (title="Preview") and Canvas Mode (title="Preview - Desktop 1" etc)
 * @returns The preview iframe element or null if not found
 */
export function getPreviewIframe(): HTMLIFrameElement | null {
  // Try normal mode first
  let iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
  if (!iframe) {
    // Try Canvas Mode iframes (find the first one)
    iframe = document.querySelector('iframe[title^="Preview - "]') as HTMLIFrameElement;
  }
  return iframe;
}
