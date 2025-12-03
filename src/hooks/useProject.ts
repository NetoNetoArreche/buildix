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
  savePage: (projectId: string, pageId: string, htmlContent: string, cssContent?: string, backgroundAssets?: BackgroundAsset[], canvasSettings?: CanvasSettings) => Promise<Page | null>;
  saveChat: (projectId: string, role: string, content: string, model?: string) => Promise<ChatMessageType | null>;
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

      // Set the home page as current page (this also loads backgroundAssets via setCurrentPage)
      const homePage = data.pages.find((p: Page) => p.isHome) || data.pages[0];
      if (homePage) {
        console.log("[useProject] Setting home page, backgroundAssets:", homePage.backgroundAssets);
        setCurrentPage(homePage);
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
    model?: string
  ): Promise<ChatMessageType | null> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, content, model }),
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
    savePage,
    saveChat,
  };
}
