"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Layout, Star, TrendingUp, Clock, Crown, Eye, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template, type TemplateCategory } from "@/lib/templates";
import { cn } from "@/lib/utils";

const filters = [
  { id: "all", name: "All", icon: Layout },
  { id: "popular", name: "Popular", icon: TrendingUp },
  { id: "recent", name: "Recent", icon: Clock },
  { id: "premium", name: "Premium", icon: Crown },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      activeCategory === "all" || template.category === activeCategory;
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "premium" && template.isPremium) ||
      activeFilter === "popular" ||
      activeFilter === "recent";
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const handleUseTemplate = (template: Template) => {
    // Store the template HTML in sessionStorage and navigate to editor
    if (typeof window !== "undefined") {
      sessionStorage.setItem("buildix-template-html", template.html);
      router.push(`/editor/new?template=${template.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          Start with a professionally designed template
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
                onClick={() => setActiveFilter(filter.id)}
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
        <Button
          variant={activeCategory === "all" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
        >
          All
          <span className="ml-1.5 text-xs text-muted-foreground">
            {TEMPLATES.length}
          </span>
        </Button>
        {TEMPLATE_CATEGORIES.map((category) => {
          const count = TEMPLATES.filter((t) => t.category === category.value).length;
          return (
            <Button
              key={category.value}
              variant={activeCategory === category.value ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.value)}
            >
              {category.label}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Layout className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No templates found</h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term or category
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onUse={() => handleUseTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{previewTemplate?.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewTemplate?.description}
                </p>
              </div>
              <Button
                variant="buildix"
                onClick={() => {
                  if (previewTemplate) {
                    handleUseTemplate(previewTemplate);
                  }
                }}
              >
                Use Template
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 p-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-4xl">
              <iframe
                srcDoc={previewTemplate?.html}
                className="w-full h-[70vh] border-0"
                title="Template Preview"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onPreview: () => void;
  onUse: () => void;
}

function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  return (
    <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-muted">
        {/* Thumbnail or fallback */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Layout className="h-10 w-10 text-muted-foreground/50" />
        </div>

        {/* Premium badge */}
        {template.isPremium && (
          <span className="absolute right-2 top-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white flex items-center gap-1">
            <Crown className="h-3 w-3" />
            PRO
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={onPreview}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            variant="buildix"
            size="sm"
            onClick={onUse}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Use
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium truncate">{template.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
