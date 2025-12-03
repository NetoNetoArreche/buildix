import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Project, Page } from "@/types";

interface ProjectState {
  // Current project
  currentProject: Project | null;
  projects: Project[];

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Page actions
  addPage: (page: Page) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (pageIds: string[]) => void;

  // Loading actions
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  immer((set) => ({
    currentProject: null,
    projects: [],
    isLoading: false,
    isSaving: false,

    setCurrentProject: (project) =>
      set((state) => {
        state.currentProject = project;
      }),

    setProjects: (projects) =>
      set((state) => {
        state.projects = projects;
      }),

    addProject: (project) =>
      set((state) => {
        state.projects.push(project);
      }),

    updateProject: (id, updates) =>
      set((state) => {
        const index = state.projects.findIndex((p) => p.id === id);
        if (index !== -1) {
          Object.assign(state.projects[index], updates);
        }
        if (state.currentProject?.id === id) {
          Object.assign(state.currentProject, updates);
        }
      }),

    deleteProject: (id) =>
      set((state) => {
        state.projects = state.projects.filter((p) => p.id !== id);
        if (state.currentProject?.id === id) {
          state.currentProject = null;
        }
      }),

    addPage: (page) =>
      set((state) => {
        if (state.currentProject) {
          state.currentProject.pages.push(page);
        }
      }),

    updatePage: (pageId, updates) =>
      set((state) => {
        if (state.currentProject) {
          const index = state.currentProject.pages.findIndex(
            (p) => p.id === pageId
          );
          if (index !== -1) {
            Object.assign(state.currentProject.pages[index], updates);
          }
        }
      }),

    deletePage: (pageId) =>
      set((state) => {
        if (state.currentProject) {
          state.currentProject.pages = state.currentProject.pages.filter(
            (p) => p.id !== pageId
          );
        }
      }),

    reorderPages: (pageIds) =>
      set((state) => {
        if (state.currentProject) {
          const pageMap = new Map(
            state.currentProject.pages.map((p) => [p.id, p])
          );
          state.currentProject.pages = pageIds
            .map((id, index) => {
              const page = pageMap.get(id);
              if (page) {
                page.order = index;
                return page;
              }
              return null;
            })
            .filter(Boolean) as Page[];
        }
      }),

    setIsLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setIsSaving: (isSaving) =>
      set((state) => {
        state.isSaving = isSaving;
      }),
  }))
);
