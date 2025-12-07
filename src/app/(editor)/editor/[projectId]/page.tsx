"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorHeader } from "@/components/editor/editor-header";
import { LeftPanel } from "@/components/editor/panels/left-panel";
import { RightPanel } from "@/components/editor/panels/right-panel";
import { Canvas } from "@/components/editor/canvas/canvas";
import { AssetBackgroundModal } from "@/components/editor/modals/AssetBackgroundModal";
import { ColorsModal } from "@/components/editor/modals/ColorsModal";
import { FontPanel } from "@/components/editor/font-panel";
import { LayersPanel } from "@/components/editor/panels/layers-panel/LayersPanel";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore } from "@/stores/editorStore";
import { useCanvasModeStore } from "@/stores/canvasModeStore";
import { useProject } from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { BackgroundAsset } from "@/types";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { leftPanelOpen, rightPanelOpen, activeModal, closeModal } = useUIStore();
  const { reset, addBackgroundAsset, setViewMode, selectElement, setSelectedElementData, backgroundAssets, htmlContent, currentPage, showLayersPanel, setShowLayersPanel } = useEditorStore();
  // Get canvas mode settings getter
  const getSettings = useCanvasModeStore((state: { getSettings: () => Record<string, unknown> }) => state.getSettings);
  const { project, isLoading, error, loadProject, createProject, savePage } = useProject();
  const [isInitialized, setIsInitialized] = useState(false);
  const isCreatingRef = useRef(false); // Prevent duplicate project creation
  const lastLoadedProjectId = useRef<string | null>(null);
  const lastSavedAssetsRef = useRef<string>("");
  const lastSavedHtmlRef = useRef<string>("");
  const lastSavedCanvasSettingsRef = useRef<string>("");

  // Handle applying a background asset from the modal
  const handleApplyBackgroundAsset = useCallback(
    (asset: BackgroundAsset) => {
      addBackgroundAsset(asset);
    },
    [addBackgroundAsset]
  );

  // Auto-save background assets when they change
  useEffect(() => {
    if (!isInitialized || projectId === "new" || !currentPage?.id) return;

    const assetsJson = JSON.stringify(backgroundAssets);

    // Skip if nothing changed (including initial load)
    if (assetsJson === lastSavedAssetsRef.current) return;

    // Update ref to current state
    lastSavedAssetsRef.current = assetsJson;

    // Debounce the save
    const timer = setTimeout(async () => {
      console.log("[EditorPage] Auto-saving background assets...");
      const saved = await savePage(projectId, currentPage.id, htmlContent, undefined, backgroundAssets);
      if (saved) {
        console.log("[EditorPage] Background assets saved successfully");
      } else {
        console.error("[EditorPage] Failed to save background assets");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [backgroundAssets, isInitialized, projectId, currentPage?.id, htmlContent, savePage]);

  // Auto-save HTML content when it changes (for Design tab image replacements, etc.)
  useEffect(() => {
    if (!isInitialized || projectId === "new" || !currentPage?.id || !htmlContent) return;

    // Skip if nothing changed (including initial load)
    if (htmlContent === lastSavedHtmlRef.current) return;

    // Update ref to current state
    lastSavedHtmlRef.current = htmlContent;

    // Debounce the save (longer delay to avoid saving during streaming)
    const timer = setTimeout(async () => {
      console.log("[EditorPage] Auto-saving HTML content...");
      const saved = await savePage(projectId, currentPage.id, htmlContent, undefined, backgroundAssets);
      if (saved) {
        console.log("[EditorPage] HTML content saved successfully");
      } else {
        console.error("[EditorPage] Failed to save HTML content");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [htmlContent, isInitialized, projectId, currentPage?.id, backgroundAssets, savePage]);

  // Auto-save Canvas Mode settings using polling to avoid re-render on each change
  useEffect(() => {
    if (!isInitialized || projectId === "new" || !currentPage?.id) return;

    let saveTimeout: NodeJS.Timeout | null = null;

    // Check for changes every 500ms
    const checkInterval = setInterval(() => {
      const canvasSettings = getSettings();
      const settingsJson = JSON.stringify(canvasSettings);

      // Skip if nothing changed
      if (settingsJson === lastSavedCanvasSettingsRef.current) return;

      // Update ref and schedule save
      lastSavedCanvasSettingsRef.current = settingsJson;

      // Clear any pending save
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Debounce the actual save by 1.5s after last change detected
      saveTimeout = setTimeout(async () => {
        console.log("[EditorPage] Auto-saving canvas settings...");
        const currentSettings = getSettings();
        const saved = await savePage(projectId, currentPage.id, htmlContent, undefined, backgroundAssets, currentSettings);
        if (saved) {
          console.log("[EditorPage] Canvas settings saved successfully");
        } else {
          console.error("[EditorPage] Failed to save canvas settings");
        }
      }, 1500);
    }, 500);

    return () => {
      clearInterval(checkInterval);
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [isInitialized, projectId, currentPage?.id, htmlContent, backgroundAssets, savePage, getSettings]);

  // Load project from database or create new one
  useEffect(() => {
    const initializeProject = async () => {
      // Skip if already initialized for this project
      if (lastLoadedProjectId.current === projectId) return;

      if (projectId === "new") {
        // Prevent duplicate creation with ref (survives re-renders)
        if (isCreatingRef.current) return;
        isCreatingRef.current = true;

        // For new projects, create in database
        const newProject = await createProject("Untitled Project");
        if (newProject) {
          // Mark as loaded before redirect to prevent re-creation
          lastLoadedProjectId.current = newProject.id;
          // Redirect to the new project's URL
          router.replace(`/editor/${newProject.id}`);
        }
        isCreatingRef.current = false;
      } else {
        // Load existing project from database
        await loadProject(projectId);
        lastLoadedProjectId.current = projectId;
      }
      setIsInitialized(true);
    };

    initializeProject();
  }, [projectId, loadProject, createProject, router]);

  // Initialize refs when project loads to prevent unnecessary save on initial load
  useEffect(() => {
    if (isInitialized) {
      if (backgroundAssets) {
        lastSavedAssetsRef.current = JSON.stringify(backgroundAssets);
      }
      if (htmlContent) {
        lastSavedHtmlRef.current = htmlContent;
      }
      // Initialize canvas settings ref
      const canvasSettings = getSettings();
      lastSavedCanvasSettingsRef.current = JSON.stringify(canvasSettings);
    }
  }, [isInitialized, getSettings]); // Only run when initialization completes

  // Reset editor state when projectId changes to a different project
  useEffect(() => {
    if (projectId !== "new" && lastLoadedProjectId.current !== projectId) {
      setIsInitialized(false);
      reset();
    }
  }, [projectId, reset]);

  // Auto-select body/main element when Background Assets modal opens (like Aura)
  useEffect(() => {
    if (activeModal === "backgroundAssets") {
      // Switch to design mode so the element can be selected
      setViewMode("design");

      // Select the body element with a slight delay to ensure iframe is ready
      const timer = setTimeout(() => {
        const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
        if (iframe?.contentDocument?.body) {
          const body = iframe.contentDocument.body;
          const firstChild = body.firstElementChild as HTMLElement;

          // Try to select the first main container or body
          const targetElement = firstChild || body;
          const elementId = targetElement.getAttribute("data-element-id") || "body";

          // Set a special ID for body if not present
          if (!targetElement.getAttribute("data-element-id")) {
            targetElement.setAttribute("data-element-id", "body");
          }

          selectElement(elementId);
          setSelectedElementData({
            id: elementId,
            tagName: targetElement.tagName.toLowerCase(),
            textContent: "",
            innerHTML: targetElement.innerHTML,
            outerHTML: targetElement.outerHTML,
            classes: targetElement.className,
            elementId: elementId,
            attributes: {},
            computedStyles: {},
            inlineStyles: {},
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [activeModal, setViewMode, selectElement, setSelectedElementData]);

  // Show loading state
  if (isLoading || (!isInitialized && projectId !== "new")) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-destructive">Error: {error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[hsl(var(--buildix-primary))] hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Editor Header */}
      <EditorHeader projectId={projectId} projectName={project?.name} />

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat History */}
        <LeftPanel projectId={projectId} project={project} />

        {/* Canvas */}
        <div
          className={cn(
            "flex-1 overflow-hidden transition-all duration-300 relative",
            !leftPanelOpen && "ml-0",
            !rightPanelOpen && "mr-0"
          )}
        >
          <Canvas />

          {/* Layers Panel - overlays the canvas */}
          <LayersPanel
            isOpen={showLayersPanel}
            onClose={() => setShowLayersPanel(false)}
          />
        </div>

        {/* Right Panel - Properties */}
        <RightPanel projectId={projectId} />
      </div>

      {/* Background Assets Modal */}
      <AssetBackgroundModal
        open={activeModal === "backgroundAssets"}
        onOpenChange={(open) => !open && closeModal()}
        onApplyAsset={handleApplyBackgroundAsset}
      />

      {/* Colors Modal */}
      <ColorsModal
        open={activeModal === "colors"}
        onOpenChange={(open) => !open && closeModal()}
      />

      {/* Font Selection Panel */}
      {activeModal === "fonts" && (
        <FontPanel onClose={closeModal} />
      )}
    </div>
  );
}
