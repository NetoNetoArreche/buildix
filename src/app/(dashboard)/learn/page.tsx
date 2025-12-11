"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Loader2,
  GraduationCap,
  PlayCircle,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Tutorial {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  videoUrl: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "getting-started", label: "Getting Started" },
  { value: "prompts", label: "Prompts" },
  { value: "advanced", label: "Advanced" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "integrations", label: "Integrations" },
];

export default function LearnPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const response = await fetch("/api/tutorials");
      if (response.ok) {
        const data = await response.json();
        setTutorials(data);
      }
    } catch (error) {
      console.error("Failed to fetch tutorials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTutorials = tutorials.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group tutorials by category
  const groupedTutorials = filteredTutorials.reduce((acc, tutorial) => {
    if (!acc[tutorial.category]) {
      acc[tutorial.category] = [];
    }
    acc[tutorial.category].push(tutorial);
    return acc;
  }, {} as Record<string, Tutorial[]>);

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

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
          <GraduationCap className="h-4 w-4" />
          Learn Buildix
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">
          Tutorials & Guides
        </h1>
        <p className="mt-2 text-muted-foreground">
          Learn how to create stunning landing pages with Buildix
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredTutorials.length} tutorials
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

      {/* Tutorials */}
      {filteredTutorials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-medium">No tutorials found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : activeCategory === "all" ? (
        // Grouped by category
        <div className="space-y-12">
          {Object.entries(groupedTutorials).map(([category, items]) => (
            <div key={category}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {getCategoryLabel(category)}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.slice(0, 3).map((tutorial) => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat grid for single category
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      )}
    </div>
  );
}

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <Link href={`/learn/${tutorial.slug}`}>
      <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {tutorial.thumbnail ? (
            <Image
              src={tutorial.thumbnail}
              alt={tutorial.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[hsl(var(--buildix-primary))]/20 to-[hsl(var(--buildix-primary))]/5">
              <BookOpen className="h-12 w-12 text-[hsl(var(--buildix-primary))]/50" />
            </div>
          )}

          {/* Video indicator */}
          {tutorial.videoUrl && (
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-black/70 text-white">
                <PlayCircle className="mr-1 h-3 w-3" />
                Video
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <Badge variant="secondary" className="mb-2 text-xs">
            {CATEGORIES.find((c) => c.value === tutorial.category)?.label ||
              tutorial.category}
          </Badge>
          <h3 className="font-medium group-hover:text-[hsl(var(--buildix-primary))] transition-colors">
            {tutorial.title}
          </h3>
          {tutorial.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {tutorial.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

const CATEGORIES_MAP = CATEGORIES;
