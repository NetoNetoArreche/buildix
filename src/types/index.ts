// Project Types
export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  userId: string;
  pages: Page[];
  settings: ProjectSettings;
  isPublished: boolean;
  publishedUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  htmlContent: string;
  cssContent?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSettings {
  fonts: FontSettings;
  colors: ColorSettings;
  metadata: MetadataSettings;
}

export interface FontSettings {
  primaryFont: string;
  secondaryFont?: string;
  importedFonts: string[];
}

// Font Configuration for Font Selection Panel
export interface FontConfig {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  bodyWeight: string;
  headingSpacing: string;
  bodySpacing: string;
}

export interface ColorSettings {
  mode: "light" | "dark";
  accentColor: string;
  customColors: { name: string; value: string }[];
}

export interface MetadataSettings {
  title: string;
  description: string;
  ogImage?: string;
  favicon?: string;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  htmlContent: string;
  previewImageUrl: string;
  thumbnailUrl: string;
  category: TemplateCategory;
  tags: string[];
  authorId: string;
  authorName: string;
  isOfficial: boolean;
  usageCount: number;
  remixCount: number;
  isPro: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory =
  | "landing-page"
  | "portfolio"
  | "saas"
  | "e-commerce"
  | "blog"
  | "dashboard"
  | "mobile"
  | "other";

// Asset Types
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  userId: string;
  isPublic: boolean;
  category?: AssetCategory;
  tags: string[];
  usageCount: number;
  createdAt: Date;
}

export type AssetType = "image" | "video" | "icon" | "illustration" | "3d";

export type AssetCategory =
  | "abstract"
  | "portrait"
  | "landscape"
  | "architecture"
  | "business"
  | "nature"
  | "food"
  | "fashion"
  | "tech"
  | "other";

// Editor Types
export type ViewMode = "preview" | "design" | "code";
export type DeviceMode = "desktop" | "tablet" | "mobile";
export type AIModel = "gemini" | "claude";
export type ContentType = "landing" | "instagram-post" | "instagram-carousel" | "instagram-story";

export interface ElementNode {
  id: string;
  tagName: string;
  attributes: Record<string, string>;
  children: ElementNode[];
  textContent?: string;
  parentId?: string;
}

// Chat Types
export interface ChatSession {
  id: string;
  projectId: string;
  pageId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  model?: AIModel;
  promptTokens?: number;
  completionTokens?: number;
  generatedHtml?: string;
  previewImageUrl?: string;
  createdAt: Date;
}

// Background Asset Types
export type BackgroundAssetType = "embed" | "video" | "image";
export type EmbedType = "unicorn" | "spline" | "custom";
export type AlphaMaskType = "none" | "top" | "bottom" | "left" | "right" | "radial";
export type BlendModeType =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export interface AlphaMaskConfig {
  enabled: boolean;
  type: AlphaMaskType;
  intensity: number; // 0-100
}

export interface OverlayConfig {
  enabled: boolean;
  color: string; // Hex color (e.g., "#000000")
  opacity: number; // 0-100
}

export interface BackgroundAsset {
  id: string;
  type: BackgroundAssetType;

  // Source
  src: string;
  embedType?: EmbedType;
  embedCode?: string; // Raw embed code for custom embeds

  // Positioning
  position: "fixed" | "absolute";
  zIndex: number;
  width: string;
  height: string;
  objectFit: "cover" | "contain" | "fill" | "none";

  // Effects (Aura-style controls)
  hue: number; // 0-360
  saturation: number; // 0-200 (100 = normal)
  brightness: number; // 0-200 (100 = normal)
  blur: number; // 0-50px
  opacity: number; // 0-100

  // Alpha Mask
  alphaMask: AlphaMaskConfig;

  // Overlay (escurece só a imagem, não afeta elementos por cima)
  overlay?: OverlayConfig;

  // Blend & Interaction
  blendMode: BlendModeType;
  invert: boolean;
  pointerEvents: "none" | "auto";

  // Video-specific
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

// Detected Asset Types (for Design Assets feature)
export type DetectedAssetType = "img" | "video" | "background";

export interface DetectedAsset {
  id: string;
  type: DetectedAssetType;
  src: string;
  alt?: string;
  elementId: string;
  instanceNumber: number;
  tagName: string;
}

// Default values for BackgroundAsset
export const defaultBackgroundAsset: Omit<BackgroundAsset, "id" | "src" | "type"> = {
  position: "fixed",
  zIndex: -1,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  hue: 0,
  saturation: 100,
  brightness: 100,
  blur: 0,
  opacity: 100,
  alphaMask: {
    enabled: false,
    type: "none",
    intensity: 50,
  },
  overlay: {
    enabled: false,
    color: "#000000",
    opacity: 50,
  },
  blendMode: "normal",
  invert: false,
  pointerEvents: "none",
  autoplay: true,
  loop: true,
  muted: true,
};
