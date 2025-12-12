"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, ArrowRight, Zap, Layout, Palette, Bot, ChevronDown, Square, Layers, Smartphone, Loader2, AtSign, ImagePlus, X, FolderOpen, Figma } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromptBuilder } from "@/components/prompt/prompt-builder";
import { CodeSnippetsModal } from "@/components/editor/modals/CodeSnippetsModal";
import { FigmaImportModal } from "@/components/editor/modals/FigmaImportModal";
import { SnippetTag } from "@/components/editor/chat/SnippetTag";
import { ComponentTag } from "@/components/editor/chat/ComponentTag";
import { TemplateTag } from "@/components/editor/chat/TemplateTag";
import { cn } from "@/lib/utils";
import type { AIModel, ContentType } from "@/types";
import { CONTENT_TYPE_OPTIONS } from "@/lib/constants/instagram-dimensions";
import { type CodeSnippet, type SelectedSnippet } from "@/lib/code-snippets";
import { type UIComponent, type SelectedComponent } from "@/lib/ui-components";
import { type TemplateWithAuthor } from "@/types/community";

interface SelectedTemplate {
  id: string;
  slug: string;
  title: string;
}
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProjectPreviewIframe } from "@/components/ui/project-preview-iframe";

const AI_MODELS: { id: AIModel; name: string; description: string }[] = [
  { id: "gemini", name: "Gemini", description: "Google's AI model - Fast & Creative" },
  { id: "claude", name: "Claude", description: "Anthropic's AI model - Detailed & Accurate" },
];

const quickPrompts = [
  {
    icon: Layout,
    title: "Landing Page",
    prompt: "Create a modern SaaS landing page with hero, features, and pricing sections",
  },
  {
    icon: Palette,
    title: "Portfolio",
    prompt: "Create a minimalist portfolio page for a designer with project gallery",
  },
  {
    icon: Zap,
    title: "Product Page",
    prompt: "Create a product landing page with hero image, benefits, and CTA",
  },
];

interface Project {
  id: string;
  name: string;
  thumbnail?: string | null;
  updatedAt: string;
  pageHtml?: string | null;
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [contentType, setContentType] = useState<ContentType>("landing");
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
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
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load Unicorn Studio script for background effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initUnicorn = () => {
      // Re-init to render any new elements with data-us-project
      if ((window as any).UnicornStudio?.init) {
        (window as any).UnicornStudio.init();
      }
    };

    // If already loaded, just re-init
    if ((window as any).UnicornStudio?.init) {
      initUnicorn();
      return;
    }

    // Load script for the first time
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.2/dist/unicornStudio.umd.js";
    script.onload = initUnicorn;
    (document.head || document.body).appendChild(script);
  }, []);

  // Fetch recent projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const projects = await response.json();
          // Get the 3 most recent projects
          const recent = projects
            .sort((a: { updatedAt: string }, b: { updatedAt: string }) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
            .slice(0, 3)
            .map((p: { id: string; name: string; thumbnail?: string; updatedAt: string; pages?: { htmlContent?: string }[] }) => ({
              id: p.id,
              name: p.name,
              thumbnail: p.thumbnail || null,
              updatedAt: formatRelativeTime(new Date(p.updatedAt)),
              pageHtml: p.pages?.[0]?.htmlContent || null,
            }));
          setRecentProjects(recent);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Handler for selecting a snippet from the modal
  const handleSelectSnippet = (snippet: CodeSnippet) => {
    if (selectedSnippets.some((s) => s.id === snippet.id)) return;
    setSelectedSnippets((prev) => [
      ...prev,
      { id: snippet.id, name: snippet.name, charCount: snippet.charCount },
    ]);
  };

  // Handler for removing a snippet
  const handleRemoveSnippet = (snippetId: string) => {
    setSelectedSnippets((prev) => prev.filter((s) => s.id !== snippetId));
  };

  // Handler for selecting a component from the modal
  const handleSelectComponent = (component: UIComponent) => {
    if (selectedComponents.some((c) => c.id === component.id)) return;
    setSelectedComponents((prev) => [
      ...prev,
      { id: component.id, name: component.name, charCount: component.charCount },
    ]);
  };

  // Handler for removing a component
  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents((prev) => prev.filter((c) => c.id !== componentId));
  };

  // Handler for selecting a template from the modal
  const handleSelectTemplate = (template: TemplateWithAuthor) => {
    if (selectedTemplates.some((t) => t.id === template.id)) return;
    setSelectedTemplates((prev) => [
      ...prev,
      { id: template.id, slug: template.slug, title: template.title },
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
    if (value.endsWith("@")) {
      setIsSnippetModalOpen(true);
      setPrompt(value.slice(0, -1));
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Build the full prompt with templates, components and snippets
    let fullPrompt = prompt.trim();

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

    // Store the prompt, model and content type in sessionStorage for the editor to pick up
    sessionStorage.setItem("buildix-pending-prompt", fullPrompt);
    sessionStorage.setItem("buildix-pending-model", selectedModel);
    sessionStorage.setItem("buildix-pending-content-type", contentType);

    // Store reference image if provided
    if (referenceImage) {
      sessionStorage.setItem("buildix-pending-reference-image", JSON.stringify({
        data: referenceImage.data,
        mimeType: referenceImage.mimeType,
      }));
    } else {
      sessionStorage.removeItem("buildix-pending-reference-image");
    }

    // Redirect immediately to the editor - generation will happen there with streaming
    router.push("/editor/new");
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);

  const handleQuickPrompt = (promptText: string) => {
    setPrompt(promptText);
  };

  const handleFigmaImport = (result: { html: string; nodeName: string; fileName: string; nodeId: string }) => {
    // Store the imported HTML in sessionStorage for the editor to pick up
    sessionStorage.setItem("buildix-figma-import", JSON.stringify({
      html: result.html,
      nodeName: result.nodeName,
      fileName: result.fileName,
    }));

    // Clear any pending prompts
    sessionStorage.removeItem("buildix-pending-prompt");
    sessionStorage.removeItem("buildix-pending-reference-image");

    // Redirect to the editor
    router.push("/editor/new");
  };

  const handlePromptBuilderGenerate = (generatedPrompt: string) => {
    setPrompt(generatedPrompt);
    setShowPromptBuilder(false);
  };

  return (
    <div className="relative min-h-full">
      {/* Unicorn Studio Background Effect - absolute within content area */}
      <div
        data-us-project="jLZcDbV4PdB7OmjLfBa3"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0, opacity: 0.4 }}
      />
      <div className="relative mx-auto max-w-4xl space-y-12 pt-16" style={{ zIndex: 1 }}>
      {/* Hero Section */}
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--buildix-primary))]/10 px-4 py-1.5 text-sm text-[hsl(var(--buildix-primary))]">
          <Sparkles className="h-4 w-4" />
          AI-Powered Builder
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Build landing pages with AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Describe your vision and watch it come to life. No coding required.
        </p>
      </div>

      {/* Main Prompt Input */}
      <div className="relative">
        <div className="rounded-xl border bg-card p-1 shadow-lg">
          {/* Selected Templates, Components and Snippets Tags */}
          {(selectedTemplates.length > 0 || selectedComponents.length > 0 || selectedSnippets.length > 0) && (
            <div className="flex flex-wrap gap-1.5 p-3 pb-0">
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
            <div className="p-3 pb-0">
              <div className="relative inline-block">
                <img
                  src={referenceImage.preview}
                  alt="Imagem de referencia"
                  className="h-20 w-auto rounded-lg border border-border object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Imagem de referencia anexada
              </p>
            </div>
          )}
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Describe the landing page you want to create... (type @ for snippets)"
            className="min-h-[120px] w-full resize-none rounded-lg border-0 bg-transparent p-4 text-base focus:outline-none focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                handleGenerate();
              }
            }}
          />
          <div className="flex items-center justify-between border-t p-3">
            <div className="flex items-center gap-2">
              {/* Content Type Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="group gap-0 overflow-hidden">
                    {contentType === "landing" && <Layout className="h-4 w-4 shrink-0" />}
                    {contentType === "instagram-post" && <Square className="h-4 w-4 shrink-0" />}
                    {contentType === "instagram-carousel" && <Layers className="h-4 w-4 shrink-0" />}
                    {contentType === "instagram-story" && <Smartphone className="h-4 w-4 shrink-0" />}
                    <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[150px] group-hover:ml-2">
                      {CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.label || "Landing Page"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setContentType(option.value as ContentType)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 cursor-pointer p-3",
                        contentType === option.value && "bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {option.value === "landing" && <Layout className="h-4 w-4" />}
                        {option.value === "instagram-post" && <Square className="h-4 w-4" />}
                        {option.value === "instagram-carousel" && <Layers className="h-4 w-4" />}
                        {option.value === "instagram-story" && <Smartphone className="h-4 w-4" />}
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-6">
                        {option.description}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* AI Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="group gap-0 overflow-hidden">
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[80px] group-hover:ml-2">
                      {currentModel?.name}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {AI_MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 cursor-pointer p-3",
                        selectedModel === model.id && "bg-accent"
                      )}
                    >
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="group gap-0 overflow-hidden" onClick={() => setShowPromptBuilder(true)}>
                <Wand2 className="h-4 w-4 shrink-0" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[120px] group-hover:ml-2">
                  Prompt Builder
                </span>
              </Button>

              {/* Code Snippets @ Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsSnippetModalOpen(true)}
                  >
                    <AtSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Code Snippets (type @)</TooltipContent>
              </Tooltip>

              {/* Image Upload Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn("h-8 w-8", referenceImage && "border-[hsl(var(--buildix-primary))] text-[hsl(var(--buildix-primary))]")}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
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

              {/* Figma Import Button - Disabled (not implemented yet) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 opacity-40 cursor-not-allowed"
                    disabled={true}
                  >
                    <Figma className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Figma Import (em breve)</TooltipContent>
              </Tooltip>

              <span className="hidden sm:inline text-xs text-muted-foreground">
                Press ⌘ + Enter to generate
              </span>
            </div>
            <Button
              variant="buildix"
              disabled={!prompt.trim()}
              onClick={handleGenerate}
            >
              Generate
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Quick Start
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickPrompts.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickPrompt(item.prompt)}
                className="group rounded-xl border bg-card p-4 text-left transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-lg bg-muted p-2.5 group-hover:bg-[hsl(var(--buildix-primary))]/10">
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(var(--buildix-primary))]" />
                </div>
                <h3 className="mb-1 font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.prompt}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent Projects
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <a href="/projects">View all</a>
          </Button>
        </div>
        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <Layout className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground">
              Create your first project using the form above
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {recentProjects.map((project) => (
              <a
                key={project.id}
                href={`/editor/${project.id}`}
                className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md"
              >
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative">
                  {project.pageHtml ? (
                    <div className="absolute inset-0 bg-white">
                      <ProjectPreviewIframe html={project.pageHtml} className="w-full h-full" />
                    </div>
                  ) : (
                    <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.updatedAt}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
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
        onImport={handleFigmaImport}
      />
      </div>
    </div>
  );
}
