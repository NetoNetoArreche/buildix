"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Tutorial {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  videoUrl: string | null;
  thumbnail: string | null;
  category: string;
  order: number;
  createdAt: string;
  prevTutorial: { slug: string; title: string } | null;
  nextTutorial: { slug: string; title: string } | null;
}

const CATEGORIES = [
  { value: "getting-started", label: "Getting Started" },
  { value: "prompts", label: "Prompts" },
  { value: "advanced", label: "Advanced" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "integrations", label: "Integrations" },
];

export default function TutorialPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchTutorial();
    }
  }, [slug]);

  const fetchTutorial = async () => {
    try {
      const response = await fetch(`/api/tutorials/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setTutorial(data);
      } else {
        setError("Tutorial not found");
      }
    } catch (error) {
      console.error("Failed to fetch tutorial:", error);
      setError("Failed to load tutorial");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  // Simple markdown to HTML converter
  const renderContent = (content: string) => {
    // Convert markdown headings
    let html = content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[hsl(var(--buildix-primary))] hover:underline" target="_blank">$1</a>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, '<br/>');

    return `<p class="my-4">${html}</p>`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Tutorial Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The tutorial you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/learn">
          <Button className="mt-6" variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Tutorials
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/learn"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Tutorials
      </Link>

      {/* Header */}
      <div className="mb-8">
        <Badge variant="secondary" className="mb-3">
          {getCategoryLabel(tutorial.category)}
        </Badge>
        <h1 className="text-3xl font-bold md:text-4xl">{tutorial.title}</h1>
        {tutorial.description && (
          <p className="mt-2 text-lg text-muted-foreground">
            {tutorial.description}
          </p>
        )}
      </div>

      {/* Video (if available) */}
      {tutorial.videoUrl && (
        <div className="mb-8">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <iframe
              src={tutorial.videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <PlayCircle className="h-4 w-4" />
            Watch the video tutorial
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderContent(tutorial.content) }}
      />

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between border-t pt-8">
        {tutorial.prevTutorial ? (
          <Link href={`/learn/${tutorial.prevTutorial.slug}`}>
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Previous</div>
                <div className="text-sm font-medium">
                  {tutorial.prevTutorial.title}
                </div>
              </div>
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {tutorial.nextTutorial ? (
          <Link href={`/learn/${tutorial.nextTutorial.slug}`}>
            <Button variant="outline">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Next</div>
                <div className="text-sm font-medium">
                  {tutorial.nextTutorial.title}
                </div>
              </div>
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
