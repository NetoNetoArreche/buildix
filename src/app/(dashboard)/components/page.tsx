"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Crown,
  Copy,
  Check,
  Eye,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComponentPreviewIframe } from "@/components/ui/component-preview-iframe";

interface UIComponent {
  id: string;
  name: string;
  description: string | null;
  category: string;
  code: string;
  tags: string[];
  isPro: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "hero", label: "Hero" },
  { value: "feature", label: "Features" },
  { value: "cta", label: "CTA" },
  { value: "pricing", label: "Pricing" },
  { value: "testimonial", label: "Testimonials" },
  { value: "footer", label: "Footer" },
  { value: "navbar", label: "Navbar" },
  { value: "card", label: "Cards" },
  { value: "form", label: "Forms" },
  { value: "gallery", label: "Gallery" },
];

export default function ComponentsPage() {
  const [components, setComponents] = useState<UIComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewComponent, setPreviewComponent] = useState<UIComponent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const response = await fetch("/api/components");
      if (response.ok) {
        const data = await response.json();
        setComponents(data.components || []);
      }
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (component: UIComponent) => {
    try {
      await navigator.clipboard.writeText(component.code);
      setCopiedId(component.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const filteredComponents = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      activeCategory === "all" || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--buildix-primary))]/10 px-4 py-1.5 text-sm font-medium text-[hsl(var(--buildix-primary))]">
          <Layers className="h-4 w-4" />
          Component Library
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">UI Components</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and copy ready-to-use components for your landing pages
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredComponents.length} components
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.value)}
            className={
              activeCategory === cat.value
                ? "bg-[hsl(var(--buildix-primary))] hover:bg-[hsl(var(--buildix-primary))]/90"
                : ""
            }
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Components Grid */}
      {filteredComponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Layers className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-medium">No components found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md"
            >
              {/* Preview */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                <ComponentPreviewIframe
                  code={component.code}
                  className="h-full w-full"
                />

                {/* PRO Badge */}
                {component.isPro && (
                  <div className="absolute left-2 top-2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      <Crown className="mr-1 h-3 w-3" />
                      PRO
                    </Badge>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewComponent(component)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleCopyCode(component)}
                    className="bg-[hsl(var(--buildix-primary))] hover:bg-[hsl(var(--buildix-primary))]/90"
                  >
                    {copiedId === component.id ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{component.name}</h3>
                    {component.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {component.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {component.category}
                  </Badge>
                  {component.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewComponent}
        onOpenChange={() => setPreviewComponent(null)}
      >
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewComponent?.name}
              {previewComponent?.isPro && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Crown className="mr-1 h-3 w-3" />
                  PRO
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border bg-white h-[60vh] overflow-hidden">
            <ComponentPreviewIframe
              code={previewComponent?.code || ""}
              className="h-full w-full"
              fullWidth
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewComponent(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => previewComponent && handleCopyCode(previewComponent)}
              className="bg-[hsl(var(--buildix-primary))] hover:bg-[hsl(var(--buildix-primary))]/90"
            >
              {copiedId === previewComponent?.id ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
