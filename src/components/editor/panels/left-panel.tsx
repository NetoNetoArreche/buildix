"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  Send,
  Wand2,
  Sparkles,
  Copy,
  Eye,
  Code,
  Bot,
  User,
  AlertCircle,
  Layout,
  LayoutDashboard,
  Square,
  Layers,
  Smartphone,
  AtSign,
  ImagePlus,
  X,
  Figma,
  ChevronDown,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore } from "@/stores/editorStore";
import { useAI } from "@/hooks/useAI";
import { useProject } from "@/hooks/useProject";
import { PromptBuilder } from "@/components/prompt/prompt-builder";
import { CodeSnippetsModal } from "@/components/editor/modals/CodeSnippetsModal";
import { FigmaImportModal } from "@/components/editor/modals/FigmaImportModal";
import { SnippetTag } from "@/components/editor/chat/SnippetTag";
import { ComponentTag } from "@/components/editor/chat/ComponentTag";
import { TemplateTag } from "@/components/editor/chat/TemplateTag";
import { cn } from "@/lib/utils";
import { generateThumbnailWithDelay } from "@/lib/thumbnail";
import type { AIModel, ContentType } from "@/types";
import { CONTENT_TYPE_OPTIONS } from "@/lib/constants/instagram-dimensions";
import { type CodeSnippet, type SelectedSnippet } from "@/lib/code-snippets";
import { type UIComponent, type SelectedComponent } from "@/lib/ui-components";
import { extractProjectDesignContext } from "@/lib/ai/design-tokens";
import { type TemplateWithAuthor } from "@/types/community";

interface SelectedTemplate {
  id: string;
  slug: string;
  title: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: AIModel;
  generatedHtml?: string;
  error?: boolean;
  showPreviewButton?: boolean;
  createdAt: Date;
}

interface LeftPanelProps {
  projectId?: string;
  project?: import("@/hooks/useProject").Project | null;
}

export function LeftPanel({ projectId, project }: LeftPanelProps) {
  const { leftPanelOpen, leftPanelWidth, togglePanel, activeModal } = useUIStore();
  const {
    isGenerating,
    generationProgress,
    htmlContent,
    setHtmlContent,
    currentPage,
    setStreamingHtml,
    setIsStreaming,
    clearStreaming,
    setViewMode,
  } = useEditorStore();
  const { generate, error: aiError } = useAI();
  const { savePage, saveChat, updateProject, createPage } = useProject();

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [enabledModels, setEnabledModels] = useState<string[]>(["gemini", "claude"]);
  const [contentType, setContentType] = useState<ContentType>("landing");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [isFigmaModalOpen, setIsFigmaModalOpen] = useState(false);
  const [selectedSnippets, setSelectedSnippets] = useState<SelectedSnippet[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([]);
  const [referenceImage, setReferenceImage] = useState<{
    data: string;
    mimeType: string;
    preview: string;
  } | null>(null);
  const [generateAIImages, setGenerateAIImages] = useState(false);

  // Fetch enabled AI models from configuration
  useEffect(() => {
    async function fetchAIConfig() {
      try {
        const response = await fetch("/api/ai-config");
        if (response.ok) {
          const data = await response.json();
          const models = data.enabledModels || ["gemini", "claude"];
          setEnabledModels(models);
          // If current model is disabled, switch to first enabled model
          if (models.length > 0 && !models.includes(selectedModel)) {
            setSelectedModel(models[0] as AIModel);
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI config:", error);
      }
    }
    fetchAIConfig();
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const streamingRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced function to update streaming HTML in the store (for real-time preview)
  // Using 200ms delay to reduce flicker - updates ~5x per second max
  const debouncedSetStreamingHtml = useCallback(
    (html: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setStreamingHtml(html);
      }, 200); // Update every 200ms max to reduce flicker
    },
    [setStreamingHtml]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Load chat messages from project when it's available
  useEffect(() => {
    if (project?.chatMessages && project.chatMessages.length > 0 && !messagesLoaded) {
      const loadedMessages: ChatMessage[] = project.chatMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        model: msg.model as AIModel | undefined,
        generatedHtml: (msg as { generatedHtml?: string }).generatedHtml || undefined,
        showPreviewButton: !!(msg as { generatedHtml?: string }).generatedHtml,
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(loadedMessages);
      setMessagesLoaded(true);
    }
  }, [project?.chatMessages, messagesLoaded]);

  // Reset messages loaded flag when project changes
  useEffect(() => {
    setMessagesLoaded(false);
  }, [projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-scroll streaming content
  useEffect(() => {
    if (streamingContent && streamingRef.current) {
      streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // Track if we've already started auto-generation for this session
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

  // Check for pending prompt from homepage and auto-generate
  // Only run when projectId is valid (not "new") AND project is loaded to ensure timing is correct
  useEffect(() => {
    // Wait for valid projectId (after redirect from /editor/new)
    if (!projectId || projectId === "new") {
      console.log("[LeftPanel] Skipping auto-generate: projectId is", projectId);
      return;
    }

    // Wait for project to be loaded from database
    if (!project) {
      console.log("[LeftPanel] Skipping auto-generate: project not loaded yet");
      return;
    }

    // Prevent running multiple times
    if (hasAutoGenerated) {
      console.log("[LeftPanel] Skipping auto-generate: already generated");
      return;
    }

    const pendingPrompt = sessionStorage.getItem("buildix-pending-prompt");
    const pendingModel = sessionStorage.getItem("buildix-pending-model") as AIModel | null;
    const pendingContentType = sessionStorage.getItem("buildix-pending-content-type") as ContentType | null;
    const pendingReferenceImageStr = sessionStorage.getItem("buildix-pending-reference-image");
    const pendingGenerateImages = sessionStorage.getItem("buildix-pending-generate-images") === "true";
    const pendingFigmaImportStr = sessionStorage.getItem("buildix-figma-import");

    console.log("[LeftPanel] Checking for pending prompt:", pendingPrompt ? "found" : "not found");
    console.log("[LeftPanel] Checking for pending reference image:", pendingReferenceImageStr ? "found" : "not found");
    console.log("[LeftPanel] Checking for pending generate images:", pendingGenerateImages);
    console.log("[LeftPanel] Checking for Figma import:", pendingFigmaImportStr ? "found" : "not found");

    // Handle Figma import - just load HTML directly without generating
    // This runs AFTER the project is loaded, so setHtmlContent will override the default content
    if (pendingFigmaImportStr) {
      setHasAutoGenerated(true);
      sessionStorage.removeItem("buildix-figma-import");

      try {
        const figmaData = JSON.parse(pendingFigmaImportStr);
        console.log("[LeftPanel] Loading Figma import:", figmaData.nodeName, "from", figmaData.fileName);

        // Set the HTML content directly from Figma (overrides the default project content)
        setHtmlContent(figmaData.html);

        // Add a message to chat about the import
        const importMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Importado do Figma: "${figmaData.nodeName}" de ${figmaData.fileName}`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, importMessage]);
      } catch (e) {
        console.error("[LeftPanel] Failed to parse Figma import:", e);
      }
      return;
    }

    if (pendingPrompt) {
      // Mark as generated to prevent re-runs
      setHasAutoGenerated(true);

      // Parse the pending reference image if it exists
      let pendingReferenceImage: { data: string; mimeType: string } | null = null;
      if (pendingReferenceImageStr) {
        try {
          pendingReferenceImage = JSON.parse(pendingReferenceImageStr);
        } catch (e) {
          console.error("[LeftPanel] Failed to parse pending reference image:", e);
        }
      }

      // Clear the pending items to prevent re-triggering on page refresh
      sessionStorage.removeItem("buildix-pending-prompt");
      sessionStorage.removeItem("buildix-pending-model");
      sessionStorage.removeItem("buildix-pending-content-type");
      sessionStorage.removeItem("buildix-pending-reference-image");
      sessionStorage.removeItem("buildix-pending-generate-images");

      // Set the model if provided
      if (pendingModel) {
        setSelectedModel(pendingModel);
      }

      // Set the content type if provided
      if (pendingContentType) {
        setContentType(pendingContentType);
      }

      // Set AI image generation toggle if enabled from Create page
      if (pendingGenerateImages) {
        setGenerateAIImages(true);
      }

      // Start generation immediately
      const autoGenerate = async () => {
        // Build the full prompt with image context if provided
        let fullPrompt = pendingPrompt;
        if (pendingReferenceImage) {
          fullPrompt = `Analyze the provided reference image and recreate a similar design. ${pendingPrompt}`;
        }

        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "user",
          content: pendingReferenceImage ? `[Imagem de referencia anexada] ${pendingPrompt}` : pendingPrompt,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setStreamingContent("");

        const modelToUse = pendingModel || "gemini";
        const typeToUse = pendingContentType || "landing";

        setIsStreaming(true, typeToUse); // Enable real-time preview with content type

        // Save user message to database
        if (projectId) {
          await saveChat(projectId, "user", pendingPrompt, modelToUse);

          // Update project name based on the prompt (truncate to 50 chars)
          const projectName = pendingPrompt.slice(0, 50) + (pendingPrompt.length > 50 ? "..." : "");
          await updateProject(projectId, { name: projectName });
        }

        console.log("[LeftPanel] Starting auto-generate with streaming...", { typeToUse, hasReferenceImage: !!pendingReferenceImage });

        // Determine the generation type based on content type
        const generationType = typeToUse === "landing" ? "generation" : typeToUse;

        const result = await generate({
          prompt: fullPrompt,
          model: modelToUse,
          type: pendingReferenceImage ? "image-reference" : generationType,
          referenceImage: pendingReferenceImage || undefined,
          generateImages: pendingGenerateImages,
          onStream: (chunk) => {
            setStreamingContent((prev) => {
              const newContent = prev + chunk;
              debouncedSetStreamingHtml(newContent); // Update store for real-time preview
              return newContent;
            });
          },
        });

        console.log("[LeftPanel] Generation complete, result:", result ? "success" : "failed");

        setStreamingContent("");
        clearStreaming(); // Clear streaming state

        const assistantContent = result
          ? "Design gerado com sucesso! Clique no botao abaixo para ver o preview."
          : `Sorry, I encountered an error: ${aiError || "Unknown error"}`;

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: assistantContent,
          model: modelToUse,
          generatedHtml: result || undefined,
          error: !result,
          showPreviewButton: !!result,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Save assistant message to database (with generatedHtml for preview buttons)
        if (projectId) {
          await saveChat(projectId, "assistant", assistantContent, modelToUse, result || undefined);
        }

        if (result) {
          setHtmlContent(result);

          // Save generated HTML to database
          if (projectId && currentPage?.id) {
            console.log("[LeftPanel] Saving generated HTML to database...");
            await savePage(projectId, currentPage.id, result);
            console.log("[LeftPanel] HTML saved successfully");

            // Generate and save thumbnail after a delay for iframe to render
            const thumbnail = await generateThumbnailWithDelay(800);
            if (thumbnail) {
              console.log("[LeftPanel] Saving thumbnail...");
              await updateProject(projectId, { thumbnail });
              console.log("[LeftPanel] Thumbnail saved successfully");
            }
          }
        }
      };

      autoGenerate();
    }
  }, [projectId, project, hasAutoGenerated, currentPage?.id, savePage, saveChat, updateProject]); // Run when projectId changes and project is loaded

  // Handler for selecting a snippet from the modal
  const handleSelectSnippet = (snippet: CodeSnippet) => {
    // Check if snippet is already selected
    if (selectedSnippets.some((s) => s.id === snippet.id)) return;

    setSelectedSnippets((prev) => [
      ...prev,
      {
        id: snippet.id,
        name: snippet.name,
        charCount: snippet.charCount,
      },
    ]);
  };

  // Handler for removing a snippet
  const handleRemoveSnippet = (snippetId: string) => {
    setSelectedSnippets((prev) => prev.filter((s) => s.id !== snippetId));
  };

  // Handler for selecting a component from the modal
  const handleSelectComponent = (component: UIComponent) => {
    // Check if component is already selected
    if (selectedComponents.some((c) => c.id === component.id)) return;

    setSelectedComponents((prev) => [
      ...prev,
      {
        id: component.id,
        name: component.name,
        charCount: component.charCount,
      },
    ]);
  };

  // Handler for removing a component
  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c.id !== componentId));
  };

  // Handler for selecting a template from the modal
  const handleSelectTemplate = (template: TemplateWithAuthor) => {
    // Check if template is already selected
    if (selectedTemplates.some((t) => t.id === template.id)) return;

    setSelectedTemplates((prev) => [
      ...prev,
      {
        id: template.id,
        slug: template.slug,
        title: template.title,
      },
    ]);
  };

  // Handler for removing a template
  const handleRemoveTemplate = (templateId: string) => {
    setSelectedTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  // Handler for prompt input change with @ detection
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);

    // Detect @ at the end of the input
    if (value.endsWith("@")) {
      setIsSnippetModalOpen(true);
      setPrompt(value.slice(0, -1)); // Remove the @ character
    }
  };

  // Handler for image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      alert("Tipo de arquivo invalido. Use PNG, JPG ou WEBP.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Imagem muito grande. Tamanho maximo: 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Extract base64 data without the data URL prefix
      const base64Data = dataUrl.split(",")[1];

      setReferenceImage({
        data: base64Data,
        mimeType: file.type,
        preview: dataUrl,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Remove reference image
  const handleRemoveImage = () => {
    setReferenceImage(null);
  };

  const handleSend = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Build the full prompt with snippets and components
    let fullPrompt = prompt;

    // Add templates to the prompt (fetch HTML from API)
    if (selectedTemplates.length > 0) {
      const templateHtmls: string[] = [];
      for (const t of selectedTemplates) {
        try {
          const response = await fetch(`/api/community/templates/${t.slug}`);
          if (response.ok) {
            const data = await response.json();
            const homePage = data.project?.pages?.find((p: any) => p.isHome) || data.project?.pages?.[0];
            if (homePage?.htmlContent) {
              templateHtmls.push(`<!-- Template: ${t.title} -->\n${homePage.htmlContent}`);
            }
          }
        } catch (e) {
          console.error("Failed to fetch template:", t.slug, e);
        }
      }
      if (templateHtmls.length > 0) {
        fullPrompt = `${fullPrompt}\n\n--- TEMPLATE REFERENCE ---\nUse the following template as a reference/starting point. You can customize and adapt the design:\n\n${templateHtmls.join("\n\n")}`;
      }
    }

    // Add components to the prompt (fetch from API)
    if (selectedComponents.length > 0) {
      const componentCodes: string[] = [];
      for (const c of selectedComponents) {
        try {
          const response = await fetch(`/api/components/${c.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.component?.code) {
              componentCodes.push(data.component.code);
            }
          }
        } catch (e) {
          console.error("Failed to fetch component:", c.id, e);
        }
      }
      if (componentCodes.length > 0) {
        fullPrompt = `${fullPrompt}\n\n--- UI COMPONENTS TO INCLUDE ---\nInclude and adapt these pre-built components in your design. You can customize them as needed:\n\n${componentCodes.join("\n\n")}`;
      }
    }

    // Add snippets to the prompt (fetch from API)
    if (selectedSnippets.length > 0) {
      const snippetCodes: string[] = [];
      for (const s of selectedSnippets) {
        try {
          const response = await fetch(`/api/snippets/${s.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.snippet?.code) {
              snippetCodes.push(data.snippet.code);
            }
          }
        } catch (e) {
          console.error("Failed to fetch snippet:", s.id, e);
        }
      }
      if (snippetCodes.length > 0) {
        fullPrompt = `${fullPrompt}\n\n--- CODE SNIPPETS TO USE ---\nUse the following code snippets in your design. Apply the CSS classes and effects as shown:\n\n${snippetCodes.join("\n\n")}`;
      }
    }

    // If there's a reference image, add context to the prompt
    if (referenceImage) {
      fullPrompt = `Analyze the provided reference image and recreate a similar design. ${fullPrompt}`;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: referenceImage ? `[Imagem de referencia anexada] ${prompt}` : prompt,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = fullPrompt; // Use the full prompt with snippets and components
    const currentReferenceImage = referenceImage; // Store before clearing
    setPrompt("");
    setSelectedSnippets([]); // Clear snippets after sending
    setSelectedComponents([]); // Clear components after sending
    setSelectedTemplates([]); // Clear templates after sending
    setReferenceImage(null); // Clear image after sending
    setStreamingContent(""); // Reset streaming content
    setIsStreaming(true, contentType); // Enable real-time preview with content type

    // Save user message to database (save the display prompt, not the full one with snippets)
    if (projectId) {
      await saveChat(projectId, "user", prompt, selectedModel);
    }

    // Determine if this is a revision (there's existing HTML content)
    // NOTE: We check htmlContent only, not messages.length, because:
    // - User may load an existing project (HTML exists but no messages)
    // - User may refresh the page (HTML exists but messages are cleared)
    const hasExistingHtml = !!htmlContent && htmlContent.trim().length > 0;

    // Detect if user wants to create a NEW page from the prompt
    // This allows creating new pages even when on a page with existing content
    // Pattern captures the page name (e.g., "crie pagina products" -> "products")
    const newPagePattern = /(?:cri[ae]|gere|fa[çc]a|nova|create|make|build|new|adicion[ae])\s*(?:a\s*)?(?:p[aá]gina|page)\s*(?:de\s*)?(\w+)/i;
    const newPageMatch = newPagePattern.exec(currentPrompt);
    const wantsNewPage = !!newPageMatch;
    const extractedPageName = newPageMatch ? newPageMatch[1] : null;

    console.log("[LeftPanel] Detection - hasExistingHtml:", hasExistingHtml, "wantsNewPage:", wantsNewPage, "extractedPageName:", extractedPageName, "prompt:", currentPrompt.substring(0, 50));

    // Track which page to save to (may change if we create a new page)
    let targetPageId = currentPage?.id;

    // If user wants to create a new page and current page has content, create the new page first
    if (wantsNewPage && hasExistingHtml && extractedPageName && projectId) {
      // Format the page name (capitalize first letter)
      const formattedPageName = extractedPageName.charAt(0).toUpperCase() + extractedPageName.slice(1).toLowerCase();

      console.log("[LeftPanel] Creating new page:", formattedPageName);

      try {
        // Create the new page - this will also switch to it
        const newPage = await createPage(projectId, formattedPageName);

        if (newPage) {
          console.log("[LeftPanel] New page created successfully:", newPage.id);
          targetPageId = newPage.id;
        } else {
          console.error("[LeftPanel] Failed to create new page");
        }
      } catch (pageError: unknown) {
        // Check if it's a usage limit error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = pageError as any;
        if (err.usageLimit) {
          // Show error message to user
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: err.message || `Você atingiu o limite de ${err.limit} páginas por projeto do seu plano. Faça upgrade para criar mais páginas!`,
            error: true,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          clearStreaming();
          return; // Stop execution - don't proceed with AI generation
        }
        // For other errors, log and continue (page might already exist)
        console.error("[LeftPanel] Error creating page:", pageError);
      }
    }

    // Check for multi-page context when:
    // 1. Current page has no HTML (truly new page), OR
    // 2. User explicitly wants to create a new page (detected from prompt)
    // This enables design consistency across multiple pages in a project
    let designContext: string | undefined;
    const isNewPage = !hasExistingHtml || (wantsNewPage && hasExistingHtml);
    const shouldUseDesignContext = (isNewPage || wantsNewPage) && contentType === "landing";

    if (shouldUseDesignContext && project?.pages && project.pages.length > 0) {
      // Find the reference page: prefer home page with content, otherwise first page with content
      // If user wants new page but current page has content, use current page as reference
      let referencePage = null;

      if (wantsNewPage && hasExistingHtml && currentPage?.id) {
        // Use current page as reference when creating a new page
        referencePage = project.pages.find(p => p.id === currentPage.id && p.htmlContent?.trim());
      }

      if (!referencePage) {
        // Try to find home page with content, or any page with content
        referencePage = project.pages.find(p => p.isHome && p.htmlContent?.trim())
          || project.pages.find(p => p.id !== currentPage?.id && p.htmlContent?.trim());
      }

      if (referencePage?.htmlContent) {
        // Send full HTML as reference for better consistency
        designContext = `
REFERENCE PAGE HTML (COPY THE DESIGN EXACTLY):
${referencePage.htmlContent}

NEW PAGE NAME: ${extractedPageName || 'new page'}
`;
        console.log("[LeftPanel] Multi-page consistency: using full HTML from reference page, wantsNewPage:", wantsNewPage);
      }
    }

    // Determine if this is actually a revision
    // It's a revision if there's existing HTML AND user is NOT asking to create a new page
    // NOTE: Removed contentType === "landing" check - revisions should work for ALL content types (including Instagram)
    const isRevision = hasExistingHtml && !wantsNewPage;

    // Determine the generation type
    let generationType: "generation" | "revision" | "revision-with-image" | "editing" | "instagram-post" | "instagram-carousel" | "instagram-story" | "mobile-app" | "dashboard" | "email-template" | "image-reference" | "page-generation";
    if (contentType !== "landing") {
      // For non-landing types (Instagram, mobile-app, dashboard, email), use the content type directly
      generationType = contentType;
    } else if (currentReferenceImage && isRevision) {
      // Revision with image reference - need to preserve existing HTML while using image as inspiration
      generationType = "revision-with-image";
    } else if (currentReferenceImage) {
      // New generation from image reference
      generationType = "image-reference";
    } else if (isRevision) {
      // Normal revision - modify existing HTML
      generationType = "revision";
    } else if (designContext) {
      // New page with design context from other pages - use page-generation for consistency
      generationType = "page-generation";
    } else {
      // New generation (first page or no context available)
      generationType = "generation";
    }

    // Use streaming to show code in real-time
    const result = await generate({
      prompt: currentPrompt,
      model: selectedModel,
      type: generationType,
      // CRITICAL: Always send currentHtml when it exists, so AI knows what to preserve
      // This enables revisions for ALL content types (landing, instagram, etc.)
      currentHtml: hasExistingHtml ? htmlContent : undefined,
      // Include design context for multi-page consistency
      designContext: designContext,
      referenceImage: currentReferenceImage ? {
        data: currentReferenceImage.data,
        mimeType: currentReferenceImage.mimeType,
      } : undefined,
      // Generate AI images alongside HTML if toggle is enabled
      generateImages: generateAIImages,
      onStream: (chunk) => {
        setStreamingContent((prev) => {
          const newContent = prev + chunk;
          debouncedSetStreamingHtml(newContent); // Update store for real-time preview
          return newContent;
        });
      },
    });

    // Clear streaming content after completion
    setStreamingContent("");
    clearStreaming(); // Clear streaming state

    const assistantContent = result
      ? "Design gerado com sucesso! Clique no botao abaixo para ver o preview."
      : `Sorry, I encountered an error: ${aiError || "Unknown error"}`;

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: assistantContent,
      model: selectedModel,
      generatedHtml: result || undefined,
      error: !result,
      showPreviewButton: !!result,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Save assistant message to database (with generatedHtml for preview buttons)
    if (projectId) {
      await saveChat(projectId, "assistant", assistantContent, selectedModel, result || undefined);
    }

    // Update the canvas with generated HTML
    if (result) {
      setHtmlContent(result);

      // Save generated HTML to database (use targetPageId which may be a newly created page)
      if (projectId && targetPageId) {
        await savePage(projectId, targetPageId, result);

        // Generate and save thumbnail after a delay for iframe to render
        const thumbnail = await generateThumbnailWithDelay(800);
        if (thumbnail) {
          await updateProject(projectId, { thumbnail });
        }
      }
    }
  };

  const handlePromptBuilderGenerate = (builderPrompt: string, refImage?: { data: string; mimeType: string }, newContentType?: string) => {
    // Just set the prompt in the input, don't execute
    setPrompt(builderPrompt);
    // Set reference image if provided (from carousel tab)
    if (refImage) {
      setReferenceImage({
        data: refImage.data,
        mimeType: refImage.mimeType,
        preview: `data:${refImage.mimeType};base64,${refImage.data}`,
      });
    }
    // Set content type if provided (e.g., "instagram-carousel" from CarouselTab)
    if (newContentType) {
      setContentType(newContentType as ContentType);
    }
    setShowPromptBuilder(false);
  };

  // Keep the old function for reference but renamed - can be removed later
  const handlePromptBuilderGenerateAndExecute = async (builderPrompt: string) => {
    setShowPromptBuilder(false);
    setStreamingContent(""); // Reset streaming content
    setIsStreaming(true, "landing"); // Enable real-time preview - prompt builder generates landing pages

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: builderPrompt,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Save user message to database
    if (projectId) {
      await saveChat(projectId, "user", builderPrompt, selectedModel);
    }

    // Use streaming to show code in real-time
    const result = await generate({
      prompt: builderPrompt,
      model: selectedModel,
      type: "generation",
      onStream: (chunk) => {
        setStreamingContent((prev) => {
          const newContent = prev + chunk;
          debouncedSetStreamingHtml(newContent); // Update store for real-time preview
          return newContent;
        });
      },
    });

    // Clear streaming content after completion
    setStreamingContent("");
    clearStreaming(); // Clear streaming state

    const assistantContent = result
      ? "Design gerado com sucesso! Clique no botao abaixo para ver o preview."
      : `Sorry, I encountered an error: ${aiError || "Unknown error"}`;

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: assistantContent,
      model: selectedModel,
      generatedHtml: result || undefined,
      error: !result,
      showPreviewButton: !!result,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Save assistant message to database (with generatedHtml for preview buttons)
    if (projectId) {
      await saveChat(projectId, "assistant", assistantContent, selectedModel, result || undefined);
    }

    if (result) {
      setHtmlContent(result);

      // Save generated HTML to database
      if (projectId && currentPage?.id) {
        await savePage(projectId, currentPage.id, result);

        // Generate and save thumbnail after a delay for iframe to render
        const thumbnail = await generateThumbnailWithDelay(800);
        if (thumbnail) {
          await updateProject(projectId, { thumbnail });
        }
      }
    }
  };

  const handleViewCode = (html: string) => {
    // Switch to code view mode
    setViewMode("code");
  };

  const handleViewPreview = () => {
    // Switch to preview mode
    setViewMode("preview");
  };

  const handleRegenerate = async (originalPrompt: string) => {
    const result = await generate({
      prompt: originalPrompt,
      model: selectedModel,
      type: "generation",
    });

    if (result) {
      setHtmlContent(result);

      // Save generated HTML to database
      if (projectId && currentPage?.id) {
        await savePage(projectId, currentPage.id, result);

        // Generate and save thumbnail after a delay for iframe to render
        const thumbnail = await generateThumbnailWithDelay(800);
        if (thumbnail) {
          await updateProject(projectId, { thumbnail });
        }
      }

      const regenerateContent = "I've regenerated the design with a fresh approach.";
      const regenerateMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: regenerateContent,
        model: selectedModel,
        generatedHtml: result,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, regenerateMessage]);

      // Save assistant message to database (with generatedHtml for preview buttons)
      if (projectId) {
        await saveChat(projectId, "assistant", regenerateContent, selectedModel, result || undefined);
      }
    }
  };

  if (!leftPanelOpen) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r bg-card py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => togglePanel("left")}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Show Chat Panel</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex h-full flex-col border-r bg-card"
        style={{ width: leftPanelWidth }}
      >
        {/* Panel Header */}
        <div className="flex h-10 items-center justify-between border-b px-3">
          <span className="text-sm font-medium">Chat</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => togglePanel("left")}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hide Panel</TooltipContent>
          </Tooltip>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-medium">Start Creating</h3>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to build or use the Prompt Builder to get started.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onViewCode={handleViewCode}
                  onRegenerate={handleRegenerate}
                  onViewPreview={handleViewPreview}
                />
              ))
            )}

            {/* Loading State with Streaming Preview */}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--buildix-primary))]/20">
                  <Bot className="h-4 w-4 text-[hsl(var(--buildix-primary))] animate-pulse" />
                </div>
                <div className="flex-1 space-y-3 rounded-lg bg-muted/80 border border-[hsl(var(--buildix-primary))]/20 p-4 overflow-hidden">
                  {/* Header with animated indicator */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--buildix-primary))]" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--buildix-primary))]" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--buildix-primary))]" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {streamingContent
                        ? `Writing code with ${selectedModel === "gemini" ? "Gemini 3 Pro" : "Claude"}...`
                        : `${selectedModel === "gemini" ? "Gemini 3 Pro" : "Claude"} is thinking...`
                      }
                    </span>
                  </div>

                  {/* Progress indicator */}
                  {!streamingContent && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3 w-3 animate-spin" />
                        <span>{generationProgress || "Analyzing your request and planning the design..."}</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-[hsl(var(--buildix-primary))]/50 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                  )}

                  {/* Streaming code preview */}
                  {streamingContent && (
                    <div
                      ref={streamingRef}
                      className="max-h-[200px] overflow-y-auto rounded-md border border-border/50 bg-background/80 p-3"
                    >
                      <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap break-all leading-relaxed">
                        <code>{streamingContent.slice(-1500)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Prompt Input */}
        <div className="border-t p-3">
          <div className="rounded-lg border bg-background">
            {/* Selected Components, Templates and Snippets Tags */}
            {(selectedComponents.length > 0 || selectedSnippets.length > 0 || selectedTemplates.length > 0) && (
              <div className="flex flex-wrap gap-1.5 p-2 pb-0">
                {selectedTemplates.map((template) => (
                  <TemplateTag
                    key={template.id}
                    template={template}
                    onRemove={() => handleRemoveTemplate(template.id)}
                  />
                ))}
                {selectedComponents.map((component) => (
                  <ComponentTag
                    key={component.id}
                    component={component}
                    onRemove={() => handleRemoveComponent(component.id)}
                  />
                ))}
                {selectedSnippets.map((snippet) => (
                  <SnippetTag
                    key={snippet.id}
                    snippet={snippet}
                    onRemove={() => handleRemoveSnippet(snippet.id)}
                  />
                ))}
              </div>
            )}
            {/* Reference Image Preview */}
            {referenceImage && (
              <div className="p-2 pb-0">
                <div className="relative inline-block">
                  <img
                    src={referenceImage.preview}
                    alt="Imagem de referencia"
                    className="h-16 w-auto rounded-md border border-border object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Imagem de referencia anexada
                </p>
              </div>
            )}
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Describe your design or ask for changes... (type @ for snippets)"
              className="min-h-[80px] w-full resize-none border-0 bg-transparent p-3 text-sm focus:outline-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSend();
                }
              }}
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between border-t p-2 gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-nowrap overflow-hidden">
                {/* Content Type Selector */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 gap-0.5"
                          disabled={isGenerating}
                        >
                          {contentType === "landing" && <Layout className="h-3 w-3" />}
                          {contentType === "instagram-post" && <Square className="h-3 w-3" />}
                          {contentType === "instagram-carousel" && <Layers className="h-3 w-3" />}
                          {contentType === "instagram-story" && <Smartphone className="h-3 w-3" />}
                          {contentType === "mobile-app" && <Smartphone className="h-3 w-3" />}
                          {contentType === "dashboard" && <LayoutDashboard className="h-3 w-3" />}
                          {contentType === "email-template" && <Mail className="h-3 w-3" />}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.label || "Content Type"}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start" className="w-56">
                    {CONTENT_TYPE_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setContentType(option.value as ContentType)}
                        className={cn(
                          "flex flex-col items-start gap-0.5 cursor-pointer p-2",
                          contentType === option.value && "bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {option.value === "landing" && <Layout className="h-3.5 w-3.5" />}
                          {option.value === "instagram-post" && <Square className="h-3.5 w-3.5" />}
                          {option.value === "instagram-carousel" && <Layers className="h-3.5 w-3.5" />}
                          {option.value === "instagram-story" && <Smartphone className="h-3.5 w-3.5" />}
                          {option.value === "mobile-app" && <Smartphone className="h-3.5 w-3.5" />}
                          {option.value === "dashboard" && <LayoutDashboard className="h-3.5 w-3.5" />}
                          {option.value === "email-template" && <Mail className="h-3.5 w-3.5" />}
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-5">
                          {option.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* AI Model Selector */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 gap-0.5"
                          disabled={isGenerating}
                        >
                          <Sparkles className="h-3 w-3" />
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{selectedModel === "gemini" ? "Gemini Pro" : "Claude Sonnet"}</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start">
                    {enabledModels.includes("gemini") && (
                      <DropdownMenuItem onClick={() => setSelectedModel("gemini")}>
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Gemini Pro
                      </DropdownMenuItem>
                    )}
                    {enabledModels.includes("claude") && (
                      <DropdownMenuItem onClick={() => setSelectedModel("claude")}>
                        <Bot className="mr-2 h-3.5 w-3.5" />
                        Claude Sonnet
                      </DropdownMenuItem>
                    )}
                    {enabledModels.length === 0 && (
                      <DropdownMenuItem disabled>
                        <span className="text-muted-foreground">Nenhum modelo disponível</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Prompt Builder */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowPromptBuilder(true)}
                      disabled={isGenerating}
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Prompt Builder</TooltipContent>
                </Tooltip>

                {/* Code Snippets @ Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setIsSnippetModalOpen(true)}
                      disabled={isGenerating}
                    >
                      <AtSign className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Code Snippets (type @)</TooltipContent>
                </Tooltip>

                {/* Image Upload Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", referenceImage && "text-[hsl(var(--buildix-primary))]")}
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isGenerating}
                    >
                      <ImagePlus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Imagem de Referencia</TooltipContent>
                </Tooltip>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {/* AI Image Generation Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={generateAIImages ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        generateAIImages && "bg-purple-500 hover:bg-purple-600 text-white"
                      )}
                      onClick={() => setGenerateAIImages(!generateAIImages)}
                      disabled={isGenerating}
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {generateAIImages ? "Gerar imagens IA: ATIVADO" : "Gerar imagens com IA"}
                  </TooltipContent>
                </Tooltip>

                {/* Figma Import Button - Disabled (not implemented yet) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-40 cursor-not-allowed"
                      disabled={true}
                    >
                      <Figma className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Figma Import (em breve)</TooltipContent>
                </Tooltip>
              </div>

              <Button
                variant="buildix"
                size="sm"
                className="h-7"
                disabled={!prompt.trim() || isGenerating}
                onClick={handleSend}
              >
                {isGenerating ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press ⌘/Ctrl + Enter to send
          </p>
        </div>
      </div>

      {/* Prompt Builder Modal */}
      {showPromptBuilder && (
        <PromptBuilder
          onGenerate={handlePromptBuilderGenerate}
          onClose={() => setShowPromptBuilder(false)}
        />
      )}

      {/* Code Snippets Modal */}
      <CodeSnippetsModal
        open={isSnippetModalOpen}
        onOpenChange={setIsSnippetModalOpen}
        onSelectSnippet={handleSelectSnippet}
        onSelectComponent={handleSelectComponent}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Figma Import Modal */}
      <FigmaImportModal
        open={isFigmaModalOpen}
        onOpenChange={setIsFigmaModalOpen}
      />
    </>
  );
}

interface ChatMessageComponentProps {
  message: ChatMessage;
  onViewCode: (html: string) => void;
  onRegenerate: (prompt: string) => void;
  onViewPreview?: () => void;
}

function ChatMessageComponent({
  message,
  onViewCode,
  onRegenerate,
  onViewPreview,
}: ChatMessageComponentProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.generatedHtml || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-[hsl(var(--buildix-primary))]" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : message.error ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          "flex-1 space-y-2 rounded-lg p-3 overflow-hidden min-w-0",
          isUser
            ? "bg-[hsl(var(--buildix-primary))]/10"
            : message.error
            ? "bg-destructive/10"
            : "bg-muted"
        )}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{message.content}</p>
        {!isUser && !message.error && message.showPreviewButton && (
          <Button
            variant="buildix"
            size="sm"
            className="mt-2 w-full"
            onClick={onViewPreview}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Preview
          </Button>
        )}
        {!isUser && !message.error && message.generatedHtml && (
          <div className="flex items-center gap-1 pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copied!" : "Copy HTML"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onViewCode(message.generatedHtml!)}
                >
                  <Code className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Code</TooltipContent>
            </Tooltip>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!isUser && message.model && (
            <>
              <span className="capitalize">{message.model}</span>
              <span>•</span>
            </>
          )}
          <span>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
