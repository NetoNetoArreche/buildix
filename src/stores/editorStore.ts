import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ViewMode, DeviceMode, ElementNode, Page, BackgroundAsset, FontConfig } from "@/types";
import { getPreviewIframe } from "@/lib/utils";

// Selected element data interface
export interface SelectedElementData {
  id: string;
  tagName: string;
  textContent: string;
  innerHTML: string;
  outerHTML: string;
  classes: string;
  elementId: string;
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
  inlineStyles: Record<string, string>; // NEW: Only inline styles (from style attribute)
}

interface EditorState {
  // Current page
  currentPage: Page | null;

  // Content
  htmlContent: string;
  cssContent: string;
  elementTree: ElementNode[];

  // Selection
  selectedElementId: string | null;
  selectedElementData: SelectedElementData | null;
  hoveredElementId: string | null;

  // History (undo/redo)
  history: string[];
  historyIndex: number;
  maxHistorySize: number;

  // View
  viewMode: ViewMode;
  zoom: number;
  deviceMode: DeviceMode;

  // Loading
  isGenerating: boolean;
  generationProgress: string;

  // Streaming (real-time preview)
  streamingHtml: string;
  isStreaming: boolean;
  streamingContentType: "landing" | "instagram-post" | "instagram-carousel" | "instagram-story" | "mobile-app" | "dashboard" | "email-template" | null;

  // Insert After Mode (for adding content after an element)
  insertAfterMode: boolean;
  insertAfterElementId: string | null;
  insertAfterElementHtml: string | null;

  // Background Assets
  backgroundAssets: BackgroundAsset[];

  // Font Configuration
  fontConfig: FontConfig | null;
  selectedFonts: string[];

  // Panels
  showLayersPanel: boolean;

  // Actions
  setCurrentPage: (page: Page | null) => void;
  setHtmlContent: (html: string, addToHistory?: boolean) => void;
  setCssContent: (css: string) => void;
  setElementTree: (tree: ElementNode[]) => void;
  selectElement: (id: string | null) => void;
  setSelectedElementData: (data: SelectedElementData | null) => void;
  hoverElement: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: string) => void;
  setStreamingHtml: (html: string) => void;
  setIsStreaming: (isStreaming: boolean, contentType?: "landing" | "instagram-post" | "instagram-carousel" | "instagram-story" | "mobile-app" | "dashboard" | "email-template") => void;
  clearStreaming: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
  setInsertAfterMode: (mode: boolean, elementId?: string | null, elementHtml?: string | null) => void;

  // Background Asset Actions
  addBackgroundAsset: (asset: BackgroundAsset) => void;
  updateBackgroundAsset: (id: string, updates: Partial<BackgroundAsset>) => void;
  removeBackgroundAsset: (id: string) => void;
  reorderBackgroundAssets: (ids: string[]) => void;
  setBackgroundAssets: (assets: BackgroundAsset[]) => void;

  // Panel Actions
  setShowLayersPanel: (show: boolean) => void;
  toggleLayersPanel: () => void;

  // Font Actions
  setFontConfig: (config: FontConfig) => void;
  setSelectedFonts: (fonts: string[]) => void;
  addSelectedFont: (font: string) => void;
  removeSelectedFont: (font: string) => void;

  // Sync Actions
  syncHtmlFromIframe: () => void;
  addToHistory: (html: string) => void;

  // Delete Actions
  deleteSelectedElement: () => boolean;
}

const initialState = {
  currentPage: null,
  htmlContent: "",
  cssContent: "",
  elementTree: [],
  selectedElementId: null,
  selectedElementData: null,
  hoveredElementId: null,
  history: [] as string[],
  historyIndex: -1,
  maxHistorySize: 50,
  viewMode: "preview" as ViewMode,
  zoom: 100,
  deviceMode: "desktop" as DeviceMode,
  isGenerating: false,
  generationProgress: "",
  streamingHtml: "",
  isStreaming: false,
  streamingContentType: null as "landing" | "instagram-post" | "instagram-carousel" | "instagram-story" | "mobile-app" | "dashboard" | "email-template" | null,
  insertAfterMode: false,
  insertAfterElementId: null as string | null,
  insertAfterElementHtml: null as string | null,
  backgroundAssets: [] as BackgroundAsset[],
  fontConfig: null as FontConfig | null,
  selectedFonts: [] as string[],
  showLayersPanel: false,
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    ...initialState,

    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
        if (page) {
          state.htmlContent = page.htmlContent;
          state.cssContent = page.cssContent || "";
          // Initialize history with the page content
          state.history = [page.htmlContent];
          state.historyIndex = 0;
          // Load background assets from the page - Prisma returns them as Json type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageAny = page as any;
          if (pageAny.backgroundAssets && Array.isArray(pageAny.backgroundAssets)) {
            console.log("[EditorStore] Loading backgroundAssets from page:", pageAny.backgroundAssets.length, "assets");
            state.backgroundAssets = pageAny.backgroundAssets as BackgroundAsset[];
          } else {
            console.log("[EditorStore] No backgroundAssets in page, resetting to empty");
            state.backgroundAssets = [];
          }
        }
      }),

    setHtmlContent: (html, addToHistory = true) =>
      set((state) => {
        state.htmlContent = html;

        if (addToHistory && html !== state.history[state.historyIndex]) {
          // Remove any redo history
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(html);

          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }

          state.history = newHistory;
          state.historyIndex = newHistory.length - 1;
        }
      }),

    setCssContent: (css) =>
      set((state) => {
        state.cssContent = css;
      }),

    setElementTree: (tree) =>
      set((state) => {
        state.elementTree = tree;
      }),

    selectElement: (id) =>
      set((state) => {
        state.selectedElementId = id;
        if (!id) {
          state.selectedElementData = null;
        }
      }),

    setSelectedElementData: (data) =>
      set((state) => {
        state.selectedElementData = data;
      }),

    hoverElement: (id) =>
      set((state) => {
        state.hoveredElementId = id;
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode;
        // Clear selection when switching away from design mode
        if (mode !== "design") {
          state.selectedElementId = null;
          state.selectedElementData = null;
        }
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = Math.max(25, Math.min(200, zoom));
      }),

    setDeviceMode: (mode) =>
      set((state) => {
        state.deviceMode = mode;
      }),

    setIsGenerating: (isGenerating) =>
      set((state) => {
        state.isGenerating = isGenerating;
      }),

    setGenerationProgress: (progress) =>
      set((state) => {
        state.generationProgress = progress;
      }),

    setStreamingHtml: (html) =>
      set((state) => {
        state.streamingHtml = html;
      }),

    setIsStreaming: (isStreaming, contentType) =>
      set((state) => {
        state.isStreaming = isStreaming;
        if (isStreaming && contentType) {
          state.streamingContentType = contentType;
        }
      }),

    clearStreaming: () =>
      set((state) => {
        state.streamingHtml = "";
        state.isStreaming = false;
        state.streamingContentType = null;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex -= 1;
          state.htmlContent = state.history[state.historyIndex];
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex += 1;
          state.htmlContent = state.history[state.historyIndex];
        }
      }),

    canUndo: () => {
      const state = get();
      return state.historyIndex > 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    reset: () => set(initialState),

    setInsertAfterMode: (mode, elementId = null, elementHtml = null) =>
      set((state) => {
        state.insertAfterMode = mode;
        state.insertAfterElementId = elementId;
        state.insertAfterElementHtml = elementHtml;
      }),

    // Background Asset Actions
    addBackgroundAsset: (asset) =>
      set((state) => {
        state.backgroundAssets.push(asset);
      }),

    updateBackgroundAsset: (id, updates) =>
      set((state) => {
        const index = state.backgroundAssets.findIndex((a) => a.id === id);
        if (index !== -1) {
          state.backgroundAssets[index] = { ...state.backgroundAssets[index], ...updates };
        }
      }),

    removeBackgroundAsset: (id) =>
      set((state) => {
        state.backgroundAssets = state.backgroundAssets.filter((a) => a.id !== id);
      }),

    reorderBackgroundAssets: (ids) =>
      set((state) => {
        const reordered = ids
          .map((id) => state.backgroundAssets.find((a) => a.id === id))
          .filter((a): a is BackgroundAsset => a !== undefined);
        state.backgroundAssets = reordered;
      }),

    setBackgroundAssets: (assets) =>
      set((state) => {
        state.backgroundAssets = assets;
      }),

    // Panel Actions
    setShowLayersPanel: (show) =>
      set((state) => {
        state.showLayersPanel = show;
        // Auto-enable design mode when opening Layers panel
        if (show) {
          state.viewMode = "design";
        }
      }),

    toggleLayersPanel: () =>
      set((state) => {
        const willOpen = !state.showLayersPanel;
        state.showLayersPanel = willOpen;
        // Auto-enable design mode when opening Layers panel
        if (willOpen) {
          state.viewMode = "design";
        }
      }),

    // Font Actions
    setFontConfig: (config) =>
      set((state) => {
        state.fontConfig = config;
      }),

    setSelectedFonts: (fonts) =>
      set((state) => {
        state.selectedFonts = fonts;
      }),

    addSelectedFont: (font) =>
      set((state) => {
        if (!state.selectedFonts.includes(font)) {
          state.selectedFonts.push(font);
        }
      }),

    removeSelectedFont: (font) =>
      set((state) => {
        state.selectedFonts = state.selectedFonts.filter((f) => f !== font);
      }),

    // Sync HTML from iframe to store (used when switching away from design mode)
    syncHtmlFromIframe: () => {
      // This function extracts clean HTML from the iframe and updates the store
      // It's called when switching away from design mode to ensure the store is up-to-date
      if (typeof window === "undefined") return;

      console.log("[EditorStore] syncHtmlFromIframe called");

      // Get the preview iframe (works in both normal and Canvas Mode)
      const iframe = getPreviewIframe();
      if (!iframe?.contentDocument) {
        console.log("[EditorStore] No iframe found or no contentDocument");
        return;
      }
      console.log("[EditorStore] Found iframe:", iframe.title);

      const doc = iframe.contentDocument;

      // Clone the body and clean buildix attributes
      const bodyClone = doc.body.cloneNode(true) as HTMLElement;

      // Remove all buildix attributes and classes
      bodyClone.querySelectorAll("[data-buildix-id]").forEach((el) => {
        el.removeAttribute("data-buildix-id");
        const currentClass = el.getAttribute("class") || "";
        const cleanedClasses = currentClass
          .split(/\s+/)
          .filter((c) => !c.startsWith("buildix-"))
          .join(" ")
          .trim();
        if (cleanedClasses) {
          el.setAttribute("class", cleanedClasses);
        } else {
          el.removeAttribute("class");
        }
      });

      // Remove buildix style tag and labels
      bodyClone.querySelectorAll("#buildix-selection-styles, .buildix-element-label, .buildix-spacing-label, .buildix-action-bar").forEach((el) => el.remove());

      // Get the full HTML document
      const htmlEl = doc.documentElement.cloneNode(true) as HTMLElement;
      const bodyInHtml = htmlEl.querySelector("body");
      if (bodyInHtml) {
        bodyInHtml.innerHTML = bodyClone.innerHTML;
      }

      // Remove buildix style from head too
      htmlEl.querySelectorAll("#buildix-selection-styles").forEach((el) => el.remove());

      // Remove duplicate/tripled Tailwind CDN styles to prevent HTML bloat
      // The Tailwind CDN script will regenerate these styles when loaded
      // This is critical to prevent "Unknown error" when sending large HTML to AI APIs
      const allStyles = htmlEl.querySelectorAll('style');
      let foundFirstTailwind = false;
      allStyles.forEach((style) => {
        const content = style.textContent || '';
        // Check for Tailwind CDN generated styles
        if (content.includes('tailwindcss') || content.includes('--tw-border-spacing') || content.includes('--tw-ring-offset-shadow')) {
          if (foundFirstTailwind) {
            // Remove duplicate Tailwind styles
            style.remove();
            console.log("[EditorStore] Removed duplicate Tailwind style tag");
          } else {
            foundFirstTailwind = true;
          }
        }
      });

      const newHtml = "<!DOCTYPE html>\n" + htmlEl.outerHTML;

      console.log("[EditorStore] Updating htmlContent, length:", newHtml.length);

      // Update the store (without adding to history to avoid duplicates)
      set((state) => {
        state.htmlContent = newHtml;
      });

      console.log("[EditorStore] htmlContent updated successfully");
    },

    // Add HTML to history without updating htmlContent (used during live editing)
    // This allows undo/redo to work without causing iframe reload
    addToHistory: (html) =>
      set((state) => {
        if (html !== state.history[state.historyIndex]) {
          // Remove any redo history
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(html);

          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }

          state.history = newHistory;
          state.historyIndex = newHistory.length - 1;
        }
      }),

    // Delete the currently selected element
    deleteSelectedElement: () => {
      const state = get();
      const { selectedElementId, selectedElementData } = state;

      if (!selectedElementId || !selectedElementData) {
        console.log("[EditorStore] No element selected to delete");
        return false;
      }

      // Prevent deleting protected elements
      const protectedTags = ["html", "head", "body"];
      if (protectedTags.includes(selectedElementData.tagName.toLowerCase())) {
        console.log("[EditorStore] Cannot delete protected element:", selectedElementData.tagName);
        return false;
      }

      // Get the iframe
      const iframe = getPreviewIframe();
      if (!iframe?.contentDocument) {
        console.log("[EditorStore] No iframe found");
        return false;
      }

      const doc = iframe.contentDocument;
      const element = doc.querySelector(`[data-buildix-id="${selectedElementId}"]`);

      if (!element) {
        console.log("[EditorStore] Element not found in DOM:", selectedElementId);
        return false;
      }

      // Remove the element from DOM
      element.remove();
      console.log("[EditorStore] Element deleted:", selectedElementId, selectedElementData.tagName);

      // Sync the HTML from iframe to store (this will add to history)
      // First, sync without history
      const bodyClone = doc.body.cloneNode(true) as HTMLElement;

      // Remove all buildix attributes and classes
      bodyClone.querySelectorAll("[data-buildix-id]").forEach((el) => {
        el.removeAttribute("data-buildix-id");
        const currentClass = el.getAttribute("class") || "";
        const cleanedClasses = currentClass
          .split(/\s+/)
          .filter((c) => !c.startsWith("buildix-"))
          .join(" ")
          .trim();
        if (cleanedClasses) {
          el.setAttribute("class", cleanedClasses);
        } else {
          el.removeAttribute("class");
        }
      });

      // Remove buildix style tag and labels
      bodyClone.querySelectorAll("#buildix-selection-styles, .buildix-element-label, .buildix-spacing-label, .buildix-action-bar").forEach((el) => el.remove());

      // Get the full HTML document
      const htmlEl = doc.documentElement.cloneNode(true) as HTMLElement;
      const bodyInHtml = htmlEl.querySelector("body");
      if (bodyInHtml) {
        bodyInHtml.innerHTML = bodyClone.innerHTML;
      }

      // Remove buildix style from head too
      htmlEl.querySelectorAll("#buildix-selection-styles").forEach((el) => el.remove());

      // Remove duplicate Tailwind styles
      const allStyles = htmlEl.querySelectorAll('style');
      let foundFirstTailwind = false;
      allStyles.forEach((style) => {
        const content = style.textContent || '';
        if (content.includes('tailwindcss') || content.includes('--tw-border-spacing') || content.includes('--tw-ring-offset-shadow')) {
          if (foundFirstTailwind) {
            style.remove();
          } else {
            foundFirstTailwind = true;
          }
        }
      });

      const newHtml = "<!DOCTYPE html>\n" + htmlEl.outerHTML;

      // Update store with new HTML (add to history for undo support)
      set((state) => {
        state.htmlContent = newHtml;
        state.selectedElementId = null;
        state.selectedElementData = null;

        // Add to history
        if (newHtml !== state.history[state.historyIndex]) {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newHtml);
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }
          state.history = newHistory;
          state.historyIndex = newHistory.length - 1;
        }
      });

      return true;
    },
  }))
);
