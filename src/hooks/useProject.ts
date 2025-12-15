"use client";

import { useState, useCallback, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvasModeStore, type CanvasSettings } from "@/stores/canvasModeStore";
import type { Page, Project as ProjectType, ChatMessage as ChatMessageType } from "@prisma/client";
import type { BackgroundAsset } from "@/types";

// Extended Project type with relations
export interface Project extends ProjectType {
  pages: Page[];
  chatMessages?: ChatMessageType[];
}

interface UseProjectReturn {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  loadProject: (projectId: string) => Promise<Project | null>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  updateProject: (projectId: string, data: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  createPage: (projectId: string, name: string, slug?: string) => Promise<Page | null>;
  deletePage: (projectId: string, pageId: string) => Promise<boolean>;
  savePage: (projectId: string, pageId: string, htmlContent: string, cssContent?: string, backgroundAssets?: BackgroundAsset[], canvasSettings?: CanvasSettings) => Promise<Page | null>;
  saveChat: (projectId: string, role: string, content: string, model?: string, generatedHtml?: string) => Promise<ChatMessageType | null>;
}

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentPage, setHtmlContent } = useEditorStore();
  const { loadSettings } = useCanvasModeStore();

  const loadProject = useCallback(async (projectId: string): Promise<Project | null> => {
    if (projectId === "new") {
      setProject(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`);

      if (!response.ok) {
        throw new Error("Failed to load project");
      }

      const data = await response.json();
      setProject(data);

      // Check if there's a pending Figma import - if so, don't set page content
      // The LeftPanel will handle loading the Figma HTML
      const hasPendingFigmaImport = typeof window !== "undefined" && sessionStorage.getItem("buildix-figma-import");

      // Set the home page as current page (this also loads backgroundAssets via setCurrentPage)
      const homePage = data.pages.find((p: Page) => p.isHome) || data.pages[0];
      if (homePage) {
        console.log("[useProject] Setting home page, backgroundAssets:", homePage.backgroundAssets, "hasPendingFigmaImport:", !!hasPendingFigmaImport);

        if (hasPendingFigmaImport) {
          // If there's a pending Figma import, set the page but don't overwrite htmlContent
          // Create a modified page with empty content so setCurrentPage doesn't overwrite
          const pageForFigma = { ...homePage, htmlContent: "" };
          setCurrentPage(pageForFigma);
        } else {
          setCurrentPage(homePage);
        }

        // Load canvas settings if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageWithSettings = homePage as any;
        if (pageWithSettings.canvasSettings) {
          console.log("[useProject] Loading canvas settings:", pageWithSettings.canvasSettings);
          loadSettings(pageWithSettings.canvasSettings);
        }
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load project";
      setError(message);
      console.error("Error loading project:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentPage, loadSettings]);

  const createProject = useCallback(async (name: string, description?: string): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      setProject(data);

      // Set the home page as current page
      const homePage = data.pages.find((p: Page) => p.isHome) || data.pages[0];
      if (homePage) {
        setCurrentPage(homePage);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      console.error("Error creating project:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentPage]);

  const updateProject = useCallback(async (projectId: string, data: Partial<Project>): Promise<Project | null> => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update project");
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      return updatedProject;
    } catch (err) {
      console.error("Error updating project:", err);
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      setProject(null);
      return true;
    } catch (err) {
      console.error("Error deleting project:", err);
      return false;
    }
  }, []);

  const createPage = useCallback(async (
    projectId: string,
    name: string,
    slug?: string
  ): Promise<Page | null> => {
    try {
      // Generate slug from name if not provided
      const pageSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const response = await fetch(`/api/projects/${projectId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: pageSlug,
          htmlContent: "", // Start with empty content - will be filled by AI generation
          isHome: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // If page already exists, find it and navigate to it
        if (errorData.error === "A page with this slug already exists") {
          console.log("[useProject] Page already exists, navigating to it:", pageSlug);

          // Find the existing page in the project
          const existingPage = project?.pages.find(p => p.slug === pageSlug);
          if (existingPage) {
            console.log("[useProject] Found existing page:", existingPage.name, existingPage.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setCurrentPage(existingPage as any);
            setHtmlContent(existingPage.htmlContent || "");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return existingPage as any;
          }
        }

        // If it's a usage limit error, throw with full context
        if (errorData.usageLimit) {
          console.log("[useProject] Page limit reached:", errorData);
          const limitError = new Error(errorData.error || "Limite de páginas atingido");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (limitError as any).usageLimit = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (limitError as any).currentPages = errorData.currentPages;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (limitError as any).limit = errorData.limit;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (limitError as any).plan = errorData.plan;
          throw limitError;
        }

        throw new Error(errorData.error || "Failed to create page");
      }

      const newPage = await response.json();
      console.log("[useProject] Created new page:", newPage.name, newPage.id);

      // Update project state with the new page
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pages: [...prev.pages, newPage],
        };
      });

      // Switch to the new page
      setCurrentPage(newPage);
      setHtmlContent("");

      return newPage;
    } catch (err) {
      console.error("Error creating page:", err);
      // Re-throw to let the caller handle it (e.g., show usage limit message)
      throw err;
    }
  }, [setCurrentPage, setHtmlContent, project?.pages]);

  const deletePage = useCallback(async (
    projectId: string,
    pageId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete page");
      }

      // Update project state - remove the deleted page
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pages: prev.pages.filter(p => p.id !== pageId),
        };
      });

      return true;
    } catch (err) {
      console.error("Error deleting page:", err);
      return false;
    }
  }, []);

  const savePage = useCallback(async (
    projectId: string,
    pageId: string,
    htmlContent: string,
    cssContent?: string,
    backgroundAssets?: BackgroundAsset[],
    canvasSettings?: CanvasSettings
  ): Promise<Page | null> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent, cssContent, backgroundAssets, canvasSettings, saveVersion: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to save page");
      }

      const updatedPage = await response.json();

      // Update project state with the new page content
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pages: prev.pages.map(p => p.id === pageId ? updatedPage : p),
        };
      });

      return updatedPage;
    } catch (err) {
      console.error("Error saving page:", err);
      return null;
    }
  }, []);

  const saveChat = useCallback(async (
    projectId: string,
    role: string,
    content: string,
    model?: string,
    generatedHtml?: string
  ): Promise<ChatMessageType | null> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content, model, generatedHtml }),
      });

      if (!response.ok) {
        throw new Error("Failed to save chat message");
      }

      return await response.json();
    } catch (err) {
      console.error("Error saving chat message:", err);
      return null;
    }
  }, []);

  return {
    project,
    isLoading,
    error,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    createPage,
    deletePage,
    savePage,
    saveChat,
  };
}
