"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Image from "next/image";
import {
  Search,
  Layout,
  TrendingUp,
  Clock,
  Crown,
  Eye,
  Play,
  Heart,
  GitFork,
  Users,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCommunityStore } from "@/stores/communityStore";
import type { TemplateWithAuthor, TemplateCategory } from "@/types/community";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "landing", label: "Landing Pages" },
  { value: "portfolio", label: "Portfolio" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "agency", label: "Agency" },
  { value: "startup", label: "Startup" },
  { value: "saas", label: "SaaS" },
  { value: "personal", label: "Personal" },
];

const filters = [
  { id: "all", name: "All", icon: Layout },
  { id: "popular", name: "Popular", icon: TrendingUp },
  { id: "recent", name: "Recent", icon: Clock },
  { id: "pro", name: "PRO", icon: Crown },
];

export default function CommunityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isFirstSearchRender = useRef(true);

  const templates = useCommunityStore((state) => state.templates);
  const pagination = useCommunityStore((state) => state.pagination);
  const storeIsLoading = useCommunityStore((state) => state.isLoading);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithAuthor | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load more handler for infinite scroll
  const loadMoreTemplates = useCallback(async () => {
    if (storeIsLoading || isLoadingMore || pagination.page >= pagination.totalPages) return;

    setIsLoadingMore(true);
    const state = useCommunityStore.getState();
    state.setPagination({ ...state.pagination, page: state.pagination.page + 1 });
    await state.fetchTemplates(false);
    setIsLoadingMore(false);
  }, [storeIsLoading, isLoadingMore, pagination.page, pagination.totalPages]);

  // Infinite scroll hook
  const hasMore = pagination.page < pagination.totalPages;
  const { ref: loadMoreRef } = useInfiniteScroll(loadMoreTemplates, {
    enabled: hasMore && !storeIsLoading && !isLoadingMore && !isInitialLoading,
  });

  // Initial fetch - só executa uma vez
  useEffect(() => {
    let isMounted = true;

    const loadTemplates = async () => {
      useCommunityStore.getState().resetFilters();
      await useCommunityStore.getState().fetchTemplates(true);
      if (isMounted) {
        setIsInitialLoading(false);
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle search with debounce - skip first render
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      useCommunityStore.getState().setFilters({ search: searchQuery || undefined });
      useCommunityStore.getState().fetchTemplates(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryChange = (category: TemplateCategory | "all") => {
    setActiveCategory(category);
    useCommunityStore.getState().setFilters({
      category: category === "all" ? undefined : category,
    });
    useCommunityStore.getState().fetchTemplates(true);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    const store = useCommunityStore.getState();

    if (filter === "popular") {
      store.setFilters({ sort: "popular", type: "all" });
    } else if (filter === "recent") {
      store.setFilters({ sort: "recent", type: "all" });
    } else if (filter === "pro") {
      store.setFilters({ type: "pro", sort: "recent" });
    } else {
      store.setFilters({ sort: "recent", type: "all" });
    }
    store.fetchTemplates(true);
  };

  const handlePreview = async (template: TemplateWithAuthor) => {
    setPreviewTemplate(template);
    setIsLoadingPreview(true);
    setPreviewHtml(null);

    try {
      const response = await fetch(`/api/community/templates/${template.slug}`);
      const data = await response.json();

      // Buscar HTML da home page
      const homePage = data.project?.pages?.find((p: any) => p.isHome) || data.project?.pages?.[0];
      if (homePage?.htmlContent) {
        setPreviewHtml(homePage.htmlContent);
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRemix = async (template: TemplateWithAuthor) => {
    if (!session?.user) {
      // TODO: Show login modal
      return;
    }

    try {
      const result = await useCommunityStore.getState().remixTemplate(template.slug);
      if (result) {
        router.push(result.redirectUrl);
      }
    } catch (error) {
      console.error("Failed to remix:", error);
    }
  };

  const handleLike = async (template: TemplateWithAuthor, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) return;

    try {
      if (template.isLiked) {
        await useCommunityStore.getState().unlikeTemplate(template.slug);
      } else {
        await useCommunityStore.getState().likeTemplate(template.slug);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  // Get category counts (simplified - just show total for now)
  const getCategoryCount = (category: TemplateCategory | "all") => {
    if (category === "all") return pagination.total;
    return templates.filter((t) => t.category === category).length;
  };

  // Loading inicial - mostra spinner centralizado igual Projects
  if (isInitialLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Community</h1>
        </div>
        <p className="text-muted-foreground">
          Discover and remix templates created by the community
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleFilterChange(filter.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {filter.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category.value}
            variant={activeCategory === category.value ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(category.value)}
          >
            {category.label}
            {category.value === "all" && pagination.total > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                {pagination.total}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {storeIsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Layout className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No templates found</h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term or category
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <CommunityTemplateCard
                key={template.id}
                template={template}
                onPreview={() => handlePreview(template)}
                onRemix={() => handleRemix(template)}
                onLike={(e) => handleLike(template, e)}
                isLoggedIn={!!session?.user}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {!hasMore && templates.length > 0 && (
              <p className="text-sm text-muted-foreground">
                You've seen all {pagination.total} templates
              </p>
            )}
          </div>
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {previewTemplate?.project?.user && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={previewTemplate.project.user.avatar || undefined} />
                    <AvatarFallback>
                      {(previewTemplate.project.user.displayName || previewTemplate.project.user.name || "A").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <DialogTitle>{previewTemplate?.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    by {previewTemplate?.project?.user?.displayName || previewTemplate?.project?.user?.name || "Anonymous"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (previewTemplate) {
                      window.open(`/t/${previewTemplate.slug}`, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open
                </Button>
                <Button
                  variant="buildix"
                  size="sm"
                  onClick={() => {
                    if (previewTemplate) {
                      handleRemix(previewTemplate);
                    }
                  }}
                  disabled={!session?.user}
                >
                  <GitFork className="mr-1.5 h-3.5 w-3.5" />
                  Remix
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 p-4">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : previewHtml ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Preview not available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CommunityTemplateCardProps {
  template: TemplateWithAuthor;
  onPreview: () => void;
  onRemix: () => void;
  onLike: (e: React.MouseEvent) => void;
  isLoggedIn: boolean;
}

function CommunityTemplateCard({
  template,
  onPreview,
  onRemix,
  onLike,
  isLoggedIn,
}: CommunityTemplateCardProps) {
  const author = template.project?.user;
  const authorName = author?.displayName || author?.name || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-muted">
        {/* Thumbnail */}
        {template.thumbnail ? (
          <Image
            src={template.thumbnail}
            alt={template.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Layout className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-2">
          {template.isPro && (
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white flex items-center gap-1">
              <Crown className="h-3 w-3" />
              PRO
            </span>
          )}
          {template.isOfficial && (
            <span className="rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-2 py-0.5 text-xs font-medium text-white flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Official
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="secondary" size="sm" onClick={onPreview}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            variant="buildix"
            size="sm"
            onClick={onRemix}
            disabled={!isLoggedIn}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Remix
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Title and Author */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium truncate flex-1">{template.title}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {template.description || "No description"}
        </p>

        {/* Author & Stats */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author?.avatar || undefined} alt={authorName} />
              <AvatarFallback className="text-xs">{authorInitial}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
              {authorName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button
              onClick={onLike}
              className={cn(
                "flex items-center gap-1 transition-colors",
                template.isLiked ? "text-red-500" : "hover:text-red-500"
              )}
              disabled={!isLoggedIn}
            >
              <Heart
                className={cn("h-4 w-4", template.isLiked && "fill-current")}
              />
              <span>{template.likeCount}</span>
            </button>

            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{template.viewCount}</span>
            </div>

            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span>{template.remixCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
