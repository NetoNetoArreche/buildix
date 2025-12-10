"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type CodeSnippet, type SnippetCategory } from "@/lib/code-snippets";
import { type UIComponent, type ComponentCategory } from "@/lib/ui-components";
import {
  Search,
  Code2,
  Layers,
  Image,
  MessageSquare,
  FileCode,
  Crown,
  Eye,
  Heart,
  Shuffle,
  Loader2,
} from "lucide-react";
import { ComponentPreviewTooltip } from "./ComponentPreviewTooltip";
import type { TemplateWithAuthor, TemplateCategory } from "@/types/community";

// Types for database resources
interface DbSnippet {
  id: string;
  name: string;
  description: string | null;
  category: string;
  code: string;
  tags: string[];
  charCount: number;
}

interface DbComponent {
  id: string;
  name: string;
  description: string | null;
  category: string;
  code: string;
  tags: string[];
  charCount: number;
  isPro: boolean;
}

interface CodeSnippetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSnippet: (snippet: CodeSnippet) => void;
  onSelectComponent?: (component: UIComponent) => void;
  onSelectTemplate?: (template: TemplateWithAuthor) => void;
}

const COMPONENT_CATEGORIES: { value: ComponentCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hero", label: "Hero" },
  { value: "feature", label: "Feature" },
  { value: "cta", label: "CTA" },
  { value: "pricing", label: "Pricing" },
  { value: "testimonial", label: "Testimonial" },
  { value: "navbar", label: "Navbar" },
  { value: "footer", label: "Footer" },
  { value: "card", label: "Card" },
];

const TEMPLATE_CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "landing", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "agency", label: "Agency" },
  { value: "startup", label: "Startup" },
  { value: "saas", label: "SaaS" },
  { value: "personal", label: "Personal" },
];

// Cache for template HTML content
const templateHtmlCache = new Map<string, string>();

// Template Preview Wrapper - fetches HTML on hover
function TemplatePreviewWrapper({
  template,
  children,
}: {
  template: TemplateWithAuthor;
  children: React.ReactNode;
}) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const handleMouseEnter = async () => {
    // Check cache first
    if (templateHtmlCache.has(template.slug)) {
      setHtmlContent(templateHtmlCache.get(template.slug)!);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const res = await fetch(`/api/community/templates/${template.slug}`);
      if (!res.ok) return;

      const data = await res.json();
      const homePage = data.project?.pages?.find((p: any) => p.isHome) || data.project?.pages?.[0];

      if (homePage?.htmlContent) {
        templateHtmlCache.set(template.slug, homePage.htmlContent);
        setHtmlContent(homePage.htmlContent);
      }
    } catch (error) {
      console.error("Failed to fetch template preview:", error);
    }
  };

  return (
    <div onMouseEnter={handleMouseEnter} className="w-full">
      {htmlContent ? (
        <ComponentPreviewTooltip code={htmlContent}>
          {children}
        </ComponentPreviewTooltip>
      ) : (
        children
      )}
    </div>
  );
}

export function CodeSnippetsModal({
  open,
  onOpenChange,
  onSelectSnippet,
  onSelectComponent,
  onSelectTemplate,
}: CodeSnippetsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("snippets");
  const [componentCategory, setComponentCategory] = useState<ComponentCategory | "all">("all");
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory | "all">("all");

  // Database resources
  const [dbSnippets, setDbSnippets] = useState<DbSnippet[]>([]);
  const [dbComponents, setDbComponents] = useState<DbComponent[]>([]);
  const [templates, setTemplates] = useState<TemplateWithAuthor[]>([]);
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Fetch database resources when modal opens
  useEffect(() => {
    if (open) {
      // Fetch snippets
      setLoadingSnippets(true);
      fetch("/api/snippets")
        .then((res) => res.json())
        .then((data) => {
          if (data.snippets) {
            setDbSnippets(data.snippets);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSnippets(false));

      // Fetch components
      setLoadingComponents(true);
      fetch("/api/components")
        .then((res) => res.json())
        .then((data) => {
          if (data.components) {
            setDbComponents(data.components);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingComponents(false));

      // Fetch community templates
      setLoadingTemplates(true);
      fetch("/api/community/templates?limit=50&sort=popular")
        .then((res) => res.json())
        .then((data) => {
          if (data.templates) {
            setTemplates(data.templates);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingTemplates(false));
    }
  }, [open]);

  // Use only database snippets (no more static CODE_SNIPPETS)
  const allSnippets = useMemo(() => {
    // Convert db snippets to CodeSnippet format
    return dbSnippets.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || "",
      category: s.category as SnippetCategory,
      code: s.code,
      tags: s.tags,
      charCount: s.charCount,
    }));
  }, [dbSnippets]);

  // Use only database components (no more static UI_COMPONENTS)
  const allComponents = useMemo(() => {
    // Convert db components to UIComponent format
    return dbComponents.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || "",
      category: c.category as ComponentCategory,
      code: c.code,
      tags: c.tags,
      charCount: c.charCount,
      isPro: c.isPro,
    }));
  }, [dbComponents]);

  const filteredSnippets = useMemo(() => {
    if (!searchQuery) return allSnippets;
    const query = searchQuery.toLowerCase();
    return allSnippets.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [searchQuery, allSnippets]);

  const filteredComponents = useMemo(() => {
    let filtered = allComponents;

    if (componentCategory !== "all") {
      filtered = filtered.filter((c) => c.category === componentCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, componentCategory, allComponents]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (templateCategory !== "all") {
      filtered = filtered.filter((t) => t.category === templateCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, templateCategory, templates]);

  const getComponentCategoryColor = (category: ComponentCategory) => {
    switch (category) {
      case "hero":
        return "bg-violet-500/20 text-violet-400";
      case "feature":
        return "bg-blue-500/20 text-blue-400";
      case "cta":
        return "bg-green-500/20 text-green-400";
      case "pricing":
        return "bg-yellow-500/20 text-yellow-400";
      case "testimonial":
        return "bg-pink-500/20 text-pink-400";
      case "navbar":
        return "bg-cyan-500/20 text-cyan-400";
      case "footer":
        return "bg-orange-500/20 text-orange-400";
      case "card":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: CodeSnippet["category"]) => {
    switch (category) {
      case "css":
        return "bg-blue-500/20 text-blue-400";
      case "js":
        return "bg-yellow-500/20 text-yellow-400";
      case "html":
        return "bg-orange-500/20 text-orange-400";
      case "mixed":
        return "bg-violet-500/20 text-violet-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTemplateCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case "landing":
        return "bg-violet-500/20 text-violet-400";
      case "portfolio":
        return "bg-blue-500/20 text-blue-400";
      case "ecommerce":
        return "bg-green-500/20 text-green-400";
      case "blog":
        return "bg-yellow-500/20 text-yellow-400";
      case "agency":
        return "bg-pink-500/20 text-pink-400";
      case "startup":
        return "bg-cyan-500/20 text-cyan-400";
      case "saas":
        return "bg-orange-500/20 text-orange-400";
      case "personal":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Resource</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="components" className="text-xs gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Components</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1">
              <FileCode className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs gap-1">
              <Image className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="snippets" className="text-xs gap-1">
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Snippets</span>
            </TabsTrigger>
            <TabsTrigger value="chats" className="text-xs gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snippets" className="mt-4 flex-1">
            <ScrollArea className="h-[400px]">
              {loadingSnippets ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <p className="text-sm">Loading snippets...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                  {filteredSnippets.map((snippet) => (
                    <button
                      key={snippet.id}
                      onClick={() => {
                        onSelectSnippet(snippet);
                        onOpenChange(false);
                      }}
                      className="flex flex-col p-3 rounded-lg border border-border/50 hover:border-[hsl(var(--buildix-primary))] hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm group-hover:text-[hsl(var(--buildix-primary))] transition-colors">
                          {snippet.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getCategoryColor(
                            snippet.category
                          )}`}
                        >
                          {snippet.category.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {snippet.description}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-1 flex-wrap">
                          {snippet.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {(snippet.charCount / 1000).toFixed(1)}K chars
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!loadingSnippets && filteredSnippets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Code2 className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No snippets found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="components" className="mt-4 flex-1">
            <div className="flex gap-2 mb-4 flex-wrap">
              {COMPONENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setComponentCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    componentCategory === cat.value
                      ? "bg-[hsl(var(--buildix-primary))] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <ScrollArea className="h-[350px]">
              {loadingComponents ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <p className="text-sm">Loading components...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                  {filteredComponents.map((component) => (
                    <ComponentPreviewTooltip key={component.id} code={component.code}>
                      <button
                        onClick={() => {
                          onSelectComponent?.(component);
                          onOpenChange(false);
                        }}
                        className="flex flex-col p-3 rounded-lg border border-border/50 hover:border-[hsl(var(--buildix-primary))] hover:bg-muted/50 transition-colors text-left group w-full"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm group-hover:text-[hsl(var(--buildix-primary))] transition-colors">
                              {component.name}
                            </span>
                            {component.isPro && (
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${getComponentCategoryColor(
                              component.category
                            )}`}
                          >
                            {component.category.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {component.description}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-1 flex-wrap">
                            {component.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {(component.charCount / 1000).toFixed(1)}K chars
                          </span>
                        </div>
                      </button>
                    </ComponentPreviewTooltip>
                  ))}
                </div>
              )}
              {!loadingComponents && filteredComponents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Layers className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No components found</p>
                  <p className="text-xs mt-1">Try a different search or category</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="mt-4 flex-1">
            <div className="flex gap-2 mb-4 flex-wrap">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setTemplateCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    templateCategory === cat.value
                      ? "bg-[hsl(var(--buildix-primary))] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <ScrollArea className="h-[350px]">
              {loadingTemplates ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <p className="text-sm">Loading templates...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                  {filteredTemplates.map((template) => (
                    <TemplatePreviewWrapper key={template.id} template={template}>
                      <button
                        onClick={() => {
                          onSelectTemplate?.(template);
                          onOpenChange(false);
                        }}
                        className="flex flex-col p-3 rounded-lg border border-border/50 hover:border-[hsl(var(--buildix-primary))] hover:bg-muted/50 transition-colors text-left group w-full"
                      >
                        {/* Thumbnail */}
                        {template.thumbnail && (
                          <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden bg-muted">
                            <img
                              src={template.thumbnail}
                              alt={template.title}
                              className="w-full h-full object-cover"
                            />
                            {template.isPro && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Crown className="h-3 w-3" />
                                PRO
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm group-hover:text-[hsl(var(--buildix-primary))] transition-colors line-clamp-1">
                            {template.title}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${getTemplateCategoryColor(
                              template.category
                            )}`}
                          >
                            {template.category.toUpperCase()}
                          </span>
                        </div>
                        {template.description && (
                          <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {template.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {template.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shuffle className="h-3 w-3" />
                            {template.remixCount}
                          </span>
                          {template.project?.user && (
                            <span className="ml-auto truncate max-w-[100px]">
                              by {template.project.user.displayName || template.project.user.name}
                            </span>
                          )}
                        </div>
                      </button>
                    </TemplatePreviewWrapper>
                  ))}
                </div>
              )}
              {!loadingTemplates && filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <FileCode className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No templates found</p>
                  <p className="text-xs mt-1">Try a different search or category</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="assets" className="mt-4 flex-1">
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
              <Image className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Assets Coming Soon</p>
              <p className="text-xs mt-1 text-center max-w-[250px]">
                Asset library will be available in a future update
              </p>
            </div>
          </TabsContent>

          <TabsContent value="chats" className="mt-4 flex-1">
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">Chat History Coming Soon</p>
              <p className="text-xs mt-1 text-center max-w-[250px]">
                Reference previous conversations in a future update
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
