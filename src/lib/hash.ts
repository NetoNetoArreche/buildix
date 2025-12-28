import crypto from "crypto";

/**
 * Generate SHA-256 hash of HTML content
 * Used for cache validation in prototype analysis
 */
export function hashHtml(html: string): string {
  return crypto.createHash("sha256").update(html).digest("hex");
}
