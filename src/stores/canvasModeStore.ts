import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { BackgroundAsset } from "@/types";

// Preset types
export type AestheticPreset = "light" | "dark" | "image-light" | "image-dark";
export type LayoutPreset =
  | "desktop" | "desktop-2" | "desktop-3" | "desktop-4" | "desktop-5"
  | "devices" | "3d" | "mockup"
  | "iphone" | "laptop" | "ipad" | "android"
  | "card" | "landscape" | "portrait" | "angle";

export type ShadowType = "none" | "sm" | "md" | "lg" | "xl" | "angle-xl";
export type BrightnessType = "none" | "dim" | "normal" | "bright";
export type BackgroundType = "embed" | "video" | "image";

// Frame device types
export type FrameDevice = "desktop" | "laptop" | "tablet" | "mobile";

// Frame configuration
export interface FrameConfig {
  device: FrameDevice;
  width: number;
  height: number;
  // Individual frame position (offset from default layout position)
  offsetX?: number;
  offsetY?: number;
}

// Device dimensions (default)
export const deviceDimensions: Record<FrameDevice, { width: number; height: number }> = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

// Device presets for dropdown (like Aura)
export interface DevicePreset {
  id: string;
  name: string;
  device: FrameDevice;
  width: number;
  height: number;
}

export const devicePresets: DevicePreset[] = [
  // Desktop presets
  { id: "desktop-fullscreen", name: "Desktop - Full Screen", device: "desktop", width: 1920, height: 1080 },
  { id: "desktop-1440", name: "Desktop - 1440×1024", device: "desktop", width: 1440, height: 1024 },
  { id: "desktop-1280", name: "Desktop - 1280×832", device: "desktop", width: 1280, height: 832 },
  // Tablet presets
  { id: "tablet-landscape", name: "Tablet - 1024×768 (Landscape)", device: "tablet", width: 1024, height: 768 },
  { id: "tablet-portrait", name: "Tablet - 768×1024 (Portrait)", device: "tablet", width: 768, height: 1024 },
  // Phone presets
  { id: "phone-17pro", name: "Phone - 402×874 (17 Pro)", device: "mobile", width: 402, height: 874 },
  { id: "phone-iphone", name: "Phone - 393×852 (iPhone)", device: "mobile", width: 393, height: 852 },
  { id: "phone-standard", name: "Phone - 375×812 (Standard)", device: "mobile", width: 375, height: 812 },
];

// Layout preset configurations - defines which frames appear
export interface LayoutConfig {
  frames: FrameConfig[];
  zoom: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;
}

export const layoutPresetConfigs: Record<LayoutPreset, LayoutConfig> = {
  // Single desktop
  desktop: {
    frames: [{ device: "desktop", ...deviceDimensions.desktop }],
    zoom: 50,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Two desktops side by side
  "desktop-2": {
    frames: [
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
    ],
    zoom: 35,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Three frames
  "desktop-3": {
    frames: [
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
    ],
    zoom: 25,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Four frames
  "desktop-4": {
    frames: [
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
    ],
    zoom: 22,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Five frames
  "desktop-5": {
    frames: [
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "desktop", ...deviceDimensions.desktop },
    ],
    zoom: 18,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Desktop + Mobile (devices)
  devices: {
    frames: [
      { device: "desktop", ...deviceDimensions.desktop },
      { device: "mobile", ...deviceDimensions.mobile },
    ],
    zoom: 45,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // 3D view
  "3d": {
    frames: [{ device: "desktop", ...deviceDimensions.desktop }],
    zoom: 50,
    rotateX: 10, rotateY: -15, rotateZ: 0, perspective: 1000,
  },
  // Mockup view
  mockup: {
    frames: [{ device: "desktop", ...deviceDimensions.desktop }],
    zoom: 55,
    rotateX: 5, rotateY: -10, rotateZ: 0, perspective: 1200,
  },
  // Single iPhone
  iphone: {
    frames: [{ device: "mobile", ...deviceDimensions.mobile }],
    zoom: 80,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Single Laptop
  laptop: {
    frames: [{ device: "laptop", ...deviceDimensions.laptop }],
    zoom: 55,
    rotateX: 15, rotateY: 0, rotateZ: 0, perspective: 800,
  },
  // Single iPad
  ipad: {
    frames: [{ device: "tablet", ...deviceDimensions.tablet }],
    zoom: 70,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Single Android
  android: {
    frames: [{ device: "mobile", ...deviceDimensions.mobile }],
    zoom: 80,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Card view (smaller desktop)
  card: {
    frames: [{ device: "desktop", width: 1280, height: 720 }],
    zoom: 60,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Landscape mobile
  landscape: {
    frames: [{ device: "mobile", width: 812, height: 375 }],
    zoom: 65,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Portrait tablet
  portrait: {
    frames: [{ device: "tablet", ...deviceDimensions.tablet }],
    zoom: 50,
    rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 0,
  },
  // Angled view
  angle: {
    frames: [{ device: "desktop", ...deviceDimensions.desktop }],
    zoom: 45,
    rotateX: 8, rotateY: -20, rotateZ: 0, perspective: 1500,
  },
};

// Aesthetic preset configurations
export const aestheticPresets: Record<AestheticPreset, Partial<CanvasModeState>> = {
  light: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e5e5e5",
    shadow: "lg",
  },
  dark: {
    backgroundColor: "#171717",
    borderColor: "#262626",
    shadow: "lg",
  },
  "image-light": {
    backgroundColor: "transparent",
    borderColor: "#ffffff50",
    shadow: "xl",
    backgroundType: "image",
  },
  "image-dark": {
    backgroundColor: "transparent",
    borderColor: "#00000050",
    shadow: "xl",
    backgroundType: "image",
  },
};

// Shadow CSS values
export const shadowStyles: Record<ShadowType, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "angle-xl": "20px 20px 60px -10px rgb(0 0 0 / 0.3), -5px -5px 30px -5px rgb(0 0 0 / 0.1)",
};

// Brightness filter values
export const brightnessStyles: Record<BrightnessType, string> = {
  none: "none",
  dim: "brightness(0.8)",
  normal: "brightness(1)",
  bright: "brightness(1.1)",
};

// Serializable settings for persistence (excludes UI state like isOpen, panX, panY)
export interface CanvasSettings {
  activeAesthetic: AestheticPreset;
  activeLayout: LayoutPreset;
  frames: FrameConfig[];
  backgroundColor: string;
  borderColor: string;
  cornerRadius: number;
  ringWidth: number;
  shadow: ShadowType;
  brightness: BrightnessType;
  zoom: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;
  backgroundType: BackgroundType;
  backgroundValue: string;
  backgroundAsset: BackgroundAsset | null; // Full asset with effects
  overlayImage: string | null;
  overlayAsset: BackgroundAsset | null; // Full overlay asset with effects
}

interface CanvasModeState {
  // Panel state
  isOpen: boolean;
  isFullscreen: boolean;

  // Presets
  activeAesthetic: AestheticPreset;
  activeLayout: LayoutPreset;

  // Current frames configuration
  frames: FrameConfig[];

  // Appearance
  backgroundColor: string;
  borderColor: string;
  cornerRadius: number;
  ringWidth: number;
  shadow: ShadowType;
  brightness: BrightnessType;
  zoom: number;

  // 3D Transforms
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;

  // Pan (for dragging canvas)
  panX: number;
  panY: number;

  // Background
  backgroundType: BackgroundType;
  backgroundValue: string;
  backgroundAsset: BackgroundAsset | null;

  // Overlay
  overlayImage: string | null;
  overlayAsset: BackgroundAsset | null;

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  toggleFullscreen: () => void;

  setAestheticPreset: (preset: AestheticPreset) => void;
  setLayoutPreset: (preset: LayoutPreset) => void;

  setBackgroundColor: (color: string) => void;
  setBorderColor: (color: string) => void;
  setCornerRadius: (radius: number) => void;
  setRingWidth: (width: number) => void;
  setShadow: (shadow: ShadowType) => void;
  setBrightness: (brightness: BrightnessType) => void;
  setZoom: (zoom: number) => void;

  setRotateX: (value: number) => void;
  setRotateY: (value: number) => void;
  setRotateZ: (value: number) => void;
  setPerspective: (value: number) => void;
  resetTransforms: () => void;

  setPan: (x: number, y: number) => void;
  resetPan: () => void;

  // Frame management
  updateFrame: (index: number, updates: Partial<FrameConfig>) => void;

  setBackgroundType: (type: BackgroundType) => void;
  setBackgroundValue: (value: string) => void;
  setBackgroundAsset: (asset: BackgroundAsset | null) => void;
  setOverlayImage: (url: string | null) => void;
  setOverlayAsset: (asset: BackgroundAsset | null) => void;

  // Persistence
  getSettings: () => CanvasSettings;
  loadSettings: (settings: Partial<CanvasSettings>) => void;

  reset: () => void;
}

const initialState = {
  isOpen: false,
  isFullscreen: false,

  activeAesthetic: "dark" as AestheticPreset,
  activeLayout: "desktop" as LayoutPreset,

  // Initial frames from desktop preset
  frames: layoutPresetConfigs.desktop.frames,

  backgroundColor: "#171717",
  borderColor: "#262626",
  cornerRadius: 16,
  ringWidth: 0,
  shadow: "lg" as ShadowType,
  brightness: "none" as BrightnessType,
  zoom: 50,

  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  perspective: 0,

  panX: 0,
  panY: 0,

  backgroundType: "embed" as BackgroundType,
  backgroundValue: "",
  backgroundAsset: null as BackgroundAsset | null,

  overlayImage: null as string | null,
  overlayAsset: null as BackgroundAsset | null,
};

export const useCanvasModeStore = create<CanvasModeState>()(
  immer((set) => ({
    ...initialState,

    setIsOpen: (isOpen) => set((state) => { state.isOpen = isOpen; }),
    toggleOpen: () => set((state) => { state.isOpen = !state.isOpen; }),

    setIsFullscreen: (isFullscreen) => set((state) => { state.isFullscreen = isFullscreen; }),
    toggleFullscreen: () => set((state) => { state.isFullscreen = !state.isFullscreen; }),

    setAestheticPreset: (preset) => set((state) => {
      state.activeAesthetic = preset;
      const config = aestheticPresets[preset];
      if (config.backgroundColor) state.backgroundColor = config.backgroundColor;
      if (config.borderColor) state.borderColor = config.borderColor;
      if (config.shadow) state.shadow = config.shadow;
      if (config.backgroundType) state.backgroundType = config.backgroundType;
    }),

    setLayoutPreset: (preset) => set((state) => {
      state.activeLayout = preset;
      const config = layoutPresetConfigs[preset];
      // Update frames
      state.frames = config.frames;
      // Update zoom and transforms
      state.zoom = config.zoom;
      state.rotateX = config.rotateX;
      state.rotateY = config.rotateY;
      state.rotateZ = config.rotateZ;
      state.perspective = config.perspective;
      // Reset pan when changing layout
      state.panX = 0;
      state.panY = 0;
    }),

    setBackgroundColor: (color) => set((state) => { state.backgroundColor = color; }),
    setBorderColor: (color) => set((state) => { state.borderColor = color; }),
    setCornerRadius: (radius) => set((state) => { state.cornerRadius = Math.max(0, Math.min(80, radius)); }),
    setRingWidth: (width) => set((state) => { state.ringWidth = Math.max(0, Math.min(16, width)); }),
    setShadow: (shadow) => set((state) => { state.shadow = shadow; }),
    setBrightness: (brightness) => set((state) => { state.brightness = brightness; }),
    setZoom: (zoom) => set((state) => { state.zoom = Math.max(10, Math.min(150, zoom)); }),

    setRotateX: (value) => set((state) => { state.rotateX = Math.max(-45, Math.min(45, value)); }),
    setRotateY: (value) => set((state) => { state.rotateY = Math.max(-45, Math.min(45, value)); }),
    setRotateZ: (value) => set((state) => { state.rotateZ = Math.max(-45, Math.min(45, value)); }),
    setPerspective: (value) => set((state) => { state.perspective = Math.max(0, Math.min(2000, value)); }),

    resetTransforms: () => set((state) => {
      state.rotateX = 0;
      state.rotateY = 0;
      state.rotateZ = 0;
      state.perspective = 0;
    }),

    setPan: (x, y) => set((state) => {
      state.panX = x;
      state.panY = y;
    }),

    resetPan: () => set((state) => {
      state.panX = 0;
      state.panY = 0;
    }),

    updateFrame: (index, updates) => set((state) => {
      if (index >= 0 && index < state.frames.length) {
        state.frames[index] = { ...state.frames[index], ...updates };
      }
    }),

    setBackgroundType: (type) => set((state) => { state.backgroundType = type; }),
    setBackgroundValue: (value) => set((state) => { state.backgroundValue = value; }),
    setBackgroundAsset: (asset) => set((state) => {
      state.backgroundAsset = asset;
      state.backgroundValue = asset?.src || "";
    }),
    setOverlayImage: (url) => set((state) => { state.overlayImage = url; }),
    setOverlayAsset: (asset) => set((state) => {
      state.overlayAsset = asset;
      state.overlayImage = asset?.src || null;
    }),

    // Get current settings for saving
    getSettings: () => {
      const state = useCanvasModeStore.getState();
      return {
        activeAesthetic: state.activeAesthetic,
        activeLayout: state.activeLayout,
        frames: state.frames,
        backgroundColor: state.backgroundColor,
        borderColor: state.borderColor,
        cornerRadius: state.cornerRadius,
        ringWidth: state.ringWidth,
        shadow: state.shadow,
        brightness: state.brightness,
        zoom: state.zoom,
        rotateX: state.rotateX,
        rotateY: state.rotateY,
        rotateZ: state.rotateZ,
        perspective: state.perspective,
        backgroundType: state.backgroundType,
        backgroundValue: state.backgroundValue,
        backgroundAsset: state.backgroundAsset,
        overlayImage: state.overlayImage,
        overlayAsset: state.overlayAsset,
      };
    },

    // Load settings from saved data
    loadSettings: (settings) => set((state) => {
      if (settings.activeAesthetic !== undefined) state.activeAesthetic = settings.activeAesthetic;
      if (settings.activeLayout !== undefined) state.activeLayout = settings.activeLayout;
      if (settings.frames !== undefined) state.frames = settings.frames;
      if (settings.backgroundColor !== undefined) state.backgroundColor = settings.backgroundColor;
      if (settings.borderColor !== undefined) state.borderColor = settings.borderColor;
      if (settings.cornerRadius !== undefined) state.cornerRadius = settings.cornerRadius;
      if (settings.ringWidth !== undefined) state.ringWidth = settings.ringWidth;
      if (settings.shadow !== undefined) state.shadow = settings.shadow;
      if (settings.brightness !== undefined) state.brightness = settings.brightness;
      if (settings.zoom !== undefined) state.zoom = settings.zoom;
      if (settings.rotateX !== undefined) state.rotateX = settings.rotateX;
      if (settings.rotateY !== undefined) state.rotateY = settings.rotateY;
      if (settings.rotateZ !== undefined) state.rotateZ = settings.rotateZ;
      if (settings.perspective !== undefined) state.perspective = settings.perspective;
      if (settings.backgroundType !== undefined) state.backgroundType = settings.backgroundType;
      if (settings.backgroundValue !== undefined) state.backgroundValue = settings.backgroundValue;
      if (settings.backgroundAsset !== undefined) state.backgroundAsset = settings.backgroundAsset;
      if (settings.overlayImage !== undefined) state.overlayImage = settings.overlayImage;
      if (settings.overlayAsset !== undefined) state.overlayAsset = settings.overlayAsset;
    }),

    reset: () => set(initialState),
  }))
);
