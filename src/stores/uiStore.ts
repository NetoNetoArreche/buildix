import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type ModalType =
  | "fonts"
  | "colors"
  | "assets"
  | "backgroundAssets"
  | "export"
  | "publish"
  | "promptBuilder"
  | "settings"
  | "newProject"
  | "deleteConfirm"
  | null;

type PanelType = "left" | "right";

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;

  // Panels
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;

  // Modals
  activeModal: ModalType;
  modalData: Record<string, unknown>;

  // Notifications
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  togglePanel: (panel: PanelType) => void;
  setPanelWidth: (panel: PanelType, width: number) => void;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    sidebarCollapsed: false,
    leftPanelOpen: true,
    rightPanelOpen: true,
    leftPanelWidth: 320,
    rightPanelWidth: 320,
    activeModal: null,
    modalData: {},
    notifications: [],

    toggleSidebar: () =>
      set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

    setSidebarCollapsed: (collapsed) =>
      set((state) => {
        state.sidebarCollapsed = collapsed;
      }),

    togglePanel: (panel) =>
      set((state) => {
        if (panel === "left") {
          state.leftPanelOpen = !state.leftPanelOpen;
        } else {
          state.rightPanelOpen = !state.rightPanelOpen;
        }
      }),

    setPanelWidth: (panel, width) =>
      set((state) => {
        const clampedWidth = Math.max(240, Math.min(600, width));
        if (panel === "left") {
          state.leftPanelWidth = clampedWidth;
        } else {
          state.rightPanelWidth = clampedWidth;
        }
      }),

    openModal: (modal, data = {}) =>
      set((state) => {
        state.activeModal = modal;
        state.modalData = data;
      }),

    closeModal: () =>
      set((state) => {
        state.activeModal = null;
        state.modalData = {};
      }),

    addNotification: (notification) =>
      set((state) => {
        const id = Math.random().toString(36).substring(7);
        state.notifications.push({ ...notification, id });
      }),

    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      }),
  }))
);
