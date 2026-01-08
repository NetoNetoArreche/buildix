/**
 * File validation utilities using magic bytes
 * Magic bytes are the first few bytes of a file that identify its type
 */

// Magic byte signatures for common image formats
const IMAGE_SIGNATURES: { [key: string]: { signature: number[]; mimeType: string } } = {
  // JPEG: starts with FF D8 FF
  jpeg: {
    signature: [0xFF, 0xD8, 0xFF],
    mimeType: "image/jpeg",
  },
  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  png: {
    signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    mimeType: "image/png",
  },
  // GIF87a: starts with 47 49 46 38 37 61
  gif87a: {
    signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    mimeType: "image/gif",
  },
  // GIF89a: starts with 47 49 46 38 39 61
  gif89a: {
    signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    mimeType: "image/gif",
  },
  // WebP: starts with 52 49 46 46 (RIFF) + 4 bytes + 57 45 42 50 (WEBP)
  webp: {
    signature: [0x52, 0x49, 0x46, 0x46],
    mimeType: "image/webp",
  },
  // BMP: starts with 42 4D
  bmp: {
    signature: [0x42, 0x4D],
    mimeType: "image/bmp",
  },
  // ICO: starts with 00 00 01 00
  ico: {
    signature: [0x00, 0x00, 0x01, 0x00],
    mimeType: "image/x-icon",
  },
  // SVG: starts with <?xml or <svg (text-based)
  // SVG validation is handled separately
};

// AVIF signature (within ftyp box)
const AVIF_FTYPES = ["avif", "avis", "mif1", "miaf"];

/**
 * Check if buffer starts with the given signature
 */
function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Check if buffer is a WebP file (needs additional check after RIFF)
 */
function isWebP(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // Check RIFF header
  if (!matchesSignature(buffer, IMAGE_SIGNATURES.webp.signature)) return false;
  // Check WEBP marker at offset 8
  return (
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50    // P
  );
}

/**
 * Check if buffer is an AVIF file
 */
function isAVIF(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // AVIF files start with ftyp box
  // Bytes 4-7 should be "ftyp"
  const ftyp = buffer.slice(4, 8).toString("ascii");
  if (ftyp !== "ftyp") return false;

  // Check brand at bytes 8-11
  const brand = buffer.slice(8, 12).toString("ascii");
  return AVIF_FTYPES.includes(brand);
}

/**
 * Check if content is SVG (text-based XML)
 */
function isSVG(buffer: Buffer): boolean {
  // SVG files are text-based, check for common patterns
  const text = buffer.slice(0, 1000).toString("utf-8").trim().toLowerCase();
  return (
    text.startsWith("<?xml") && text.includes("<svg") ||
    text.startsWith("<svg") ||
    text.includes("<!doctype svg")
  );
}

export interface ValidationResult {
  valid: boolean;
  detectedType: string | null;
  mimeType: string | null;
  error?: string;
}

/**
 * Validate image file by checking magic bytes
 * @param buffer The file buffer to validate
 * @param declaredMimeType The MIME type declared by the client (optional)
 * @returns ValidationResult with detected type info
 */
export function validateImageMagicBytes(
  buffer: Buffer,
  declaredMimeType?: string
): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      detectedType: null,
      mimeType: null,
      error: "Empty file",
    };
  }

  // Minimum file size check (8 bytes for valid image header)
  if (buffer.length < 8) {
    return {
      valid: false,
      detectedType: null,
      mimeType: null,
      error: "File too small to be a valid image",
    };
  }

  // Check each image type
  // JPEG
  if (matchesSignature(buffer, IMAGE_SIGNATURES.jpeg.signature)) {
    return { valid: true, detectedType: "jpeg", mimeType: "image/jpeg" };
  }

  // PNG
  if (matchesSignature(buffer, IMAGE_SIGNATURES.png.signature)) {
    return { valid: true, detectedType: "png", mimeType: "image/png" };
  }

  // GIF
  if (
    matchesSignature(buffer, IMAGE_SIGNATURES.gif87a.signature) ||
    matchesSignature(buffer, IMAGE_SIGNATURES.gif89a.signature)
  ) {
    return { valid: true, detectedType: "gif", mimeType: "image/gif" };
  }

  // WebP
  if (isWebP(buffer)) {
    return { valid: true, detectedType: "webp", mimeType: "image/webp" };
  }

  // AVIF
  if (isAVIF(buffer)) {
    return { valid: true, detectedType: "avif", mimeType: "image/avif" };
  }

  // BMP
  if (matchesSignature(buffer, IMAGE_SIGNATURES.bmp.signature)) {
    return { valid: true, detectedType: "bmp", mimeType: "image/bmp" };
  }

  // ICO
  if (matchesSignature(buffer, IMAGE_SIGNATURES.ico.signature)) {
    return { valid: true, detectedType: "ico", mimeType: "image/x-icon" };
  }

  // SVG (text-based, check last)
  if (isSVG(buffer)) {
    return { valid: true, detectedType: "svg", mimeType: "image/svg+xml" };
  }

  return {
    valid: false,
    detectedType: null,
    mimeType: null,
    error: "Unknown or unsupported image format",
  };
}

/**
 * List of allowed image MIME types for upload
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];

/**
 * Maximum file size for image uploads (10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * Validate an uploaded image file completely
 * @param buffer File buffer
 * @param declaredMimeType MIME type declared by the client
 * @param maxSize Maximum allowed size (default 10MB)
 * @returns ValidationResult
 */
export function validateUploadedImage(
  buffer: Buffer,
  declaredMimeType: string,
  maxSize: number = MAX_IMAGE_SIZE
): ValidationResult {
  // Size check
  if (buffer.length > maxSize) {
    return {
      valid: false,
      detectedType: null,
      mimeType: null,
      error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Magic bytes validation
  const magicResult = validateImageMagicBytes(buffer, declaredMimeType);
  if (!magicResult.valid) {
    return magicResult;
  }

  // Check if detected type is in allowed list
  if (!ALLOWED_IMAGE_TYPES.includes(magicResult.mimeType!)) {
    return {
      valid: false,
      detectedType: magicResult.detectedType,
      mimeType: magicResult.mimeType,
      error: `Image type ${magicResult.detectedType} is not allowed`,
    };
  }

  return magicResult;
}
