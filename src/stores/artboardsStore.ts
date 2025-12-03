import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";

// Device presets with dimensions
export type DeviceType = "desktop" | "laptop" | "tablet" | "mobile" | "custom";

export interface DevicePreset {
  type: DeviceType;
  name: string;
  width: number;
  height: number;
}

export const devicePresets: Record<DeviceType, DevicePreset> = {
  desktop: { type: "desktop", name: "Desktop", width: 1920, height: 1080 },
  laptop: { type: "laptop", name: "Laptop", width: 1440, height: 900 },
  tablet: { type: "tablet", name: "Tablet", width: 768, height: 1024 },
  mobile: { type: "mobile", name: "Mobile", width: 375, height: 812 },
  custom: { type: "custom", name: "Custom", width: 1280, height: 720 },
};

// Artboard interface
export interface Artboard {
  id: string;
  name: string;
  device: DeviceType;
  width: number;
  height: number;
  scale: number;
  position: { x: number; y: number };
}

interface ArtboardsState {
  // Artboards list
  artboards: Artboard[];

  // Currently selected/focused artboard
  selectedArtboardId: string | null;

  // Actions
  addArtboard: (device?: DeviceType) => void;
  removeArtboard: (id: string) => void;
  duplicateArtboard: (id: string) => void;

  selectArtboard: (id: string | null) => void;

  updateArtboard: (id: string, updates: Partial<Omit<Artboard, "id">>) => void;
  setArtboardDevice: (id: string, device: DeviceType) => void;
  setArtboardDimensions: (id: string, width: number, height: number) => void;
  setArtboardScale: (id: string, scale: number) => void;
  setArtboardPosition: (id: string, x: number, y: number) => void;
  setArtboardName: (id: string, name: string) => void;

  // Reorder artboards
  reorderArtboards: (fromIndex: number, toIndex: number) => void;

  // Reset
  reset: () => void;
}

// Generate initial position for new artboard (grid layout)
function getNewArtboardPosition(artboards: Artboard[]): { x: number; y: number } {
  if (artboards.length === 0) {
    return { x: 0, y: 0 };
  }

  // Place new artboard to the right of the rightmost artboard
  const rightmostArtboard = artboards.reduce((max, artboard) => {
    const rightEdge = artboard.position.x + artboard.width;
    return rightEdge > max.rightEdge ? { artboard, rightEdge } : max;
  }, { artboard: artboards[0], rightEdge: artboards[0].position.x + artboards[0].width });

  return {
    x: rightmostArtboard.rightEdge + 100, // 100px gap
    y: rightmostArtboard.artboard.position.y,
  };
}

// Initial state with one desktop artboard
const createInitialArtboard = (): Artboard => ({
  id: nanoid(),
  name: "Desktop",
  device: "desktop",
  width: devicePresets.desktop.width,
  height: devicePresets.desktop.height,
  scale: 0.5, // 50% scale by default
  position: { x: 0, y: 0 },
});

const initialState = {
  artboards: [createInitialArtboard()],
  selectedArtboardId: null as string | null,
};

export const useArtboardsStore = create<ArtboardsState>()(
  immer((set, get) => ({
    ...initialState,

    addArtboard: (device = "desktop") => set((state) => {
      const preset = devicePresets[device];
      const position = getNewArtboardPosition(state.artboards);
      const count = state.artboards.filter((a) => a.device === device).length + 1;

      const newArtboard: Artboard = {
        id: nanoid(),
        name: `${preset.name}${count > 1 ? ` ${count}` : ""}`,
        device,
        width: preset.width,
        height: preset.height,
        scale: 0.5,
        position,
      };

      state.artboards.push(newArtboard);
      state.selectedArtboardId = newArtboard.id;
    }),

    removeArtboard: (id) => set((state) => {
      const index = state.artboards.findIndex((a) => a.id === id);
      if (index !== -1) {
        state.artboards.splice(index, 1);

        // Select another artboard if the removed one was selected
        if (state.selectedArtboardId === id) {
          state.selectedArtboardId = state.artboards.length > 0
            ? state.artboards[Math.max(0, index - 1)].id
            : null;
        }
      }
    }),

    duplicateArtboard: (id) => set((state) => {
      const original = state.artboards.find((a) => a.id === id);
      if (!original) return;

      const position = getNewArtboardPosition(state.artboards);

      const duplicate: Artboard = {
        ...original,
        id: nanoid(),
        name: `${original.name} Copy`,
        position,
      };

      state.artboards.push(duplicate);
      state.selectedArtboardId = duplicate.id;
    }),

    selectArtboard: (id) => set((state) => {
      state.selectedArtboardId = id;
    }),

    updateArtboard: (id, updates) => set((state) => {
      const artboard = state.artboards.find((a) => a.id === id);
      if (artboard) {
        Object.assign(artboard, updates);
      }
    }),

    setArtboardDevice: (id, device) => set((state) => {
      const artboard = state.artboards.find((a) => a.id === id);
      if (artboard) {
        const preset = devicePresets[device];
        artboard.device = device;
        artboard.width = preset.width;
        artboard.height = preset.height;
        // Keep the name unless it's the preset name
        const oldPreset = devicePresets[artboard.device];
        if (artboard.name.startsWith(oldPreset.name)) {
          artboard.name = preset.name;
        }
      }
    }),

    setArtboardDimensions: (id, width, height) => set((state) => {
      const artboard = state.artboards.find((a) => a.id === id);
      if (artboard) {
        artboard.width = Math.max(100, width);
        artboard.height = Math.max(100, height);
        // Mark as custom if dimensions don't match any preset
        const matchingPreset = Object.values(devicePresets).find(
          (p) => p.width === artboard.width && p.height === artboard.height
        );
        if (!matchingPreset) {
          artboard.device = "custom";
        }
      }
    }),

    setArtboardScale: (id, scale) => set((state) => {
      const artboard = state.artboards.find((a) => a.id === id);
      if (artboard) {
        artboard.scale = Math.max(0.1, Math.min(2, scale)); // 10% to 200%
      }
    }),

    setArtboardPosition: (id, x, y) => set((state) => {
      const artboard = state.artboards.find((a) => a.id === id);
      if (artboard) {
        artboard.position = { x, y };
      }
    }),

    setArtboardName: (id, name) => set((state) => {
      const artboard = state.artboards.find((a) => a.id === id);
      if (artboard) {
        artboard.name = name.trim() || "Untitled";
      }
    }),

    reorderArtboards: (fromIndex, toIndex) => set((state) => {
      const [removed] = state.artboards.splice(fromIndex, 1);
      state.artboards.splice(toIndex, 0, removed);
    }),

    reset: () => set(initialState),
  }))
);
