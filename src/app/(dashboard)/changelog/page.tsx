"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Loader2,
  History,
  Sparkles,
  Zap,
  Bug,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntry {
  id: string;
  version: string | null;
  title: string;
  description: string;
  type: string;
  imageUrl: string | null;
  publishedAt: string;
}

const TYPES = [
  { value: "all", label: "All", icon: History, color: "bg-zinc-500" },
  { value: "feature", label: "Features", icon: Sparkles, color: "bg-violet-500" },
  { value: "improvement", label: "Improvements", icon: Zap, color: "bg-blue-500" },
  { value: "fix", label: "Bug Fixes", icon: Bug, color: "bg-green-500" },
  { value: "announcement", label: "Announcements", icon: Megaphone, color: "bg-yellow-500" },
];

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/changelog");
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Failed to fetch changelog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    return activeType === "all" || e.type === activeType;
  });

  const getTypeConfig = (type: string) => {
    return TYPES.find((t) => t.value === type) || TYPES[1];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Group entries by month/year
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = new Date(entry.publishedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) {
      acc[key] = { label, entries: [] };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { label: string; entries: ChangelogEntry[] }>);

  // Simple markdown to HTML converter
  const renderDescription = (content: string) => {
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mt-2">')
      .replace(/\n/g, '<br/>');
    return `<p>${html}</p>`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--buildix-primary))]/10 px-4 py-1.5 text-sm font-medium text-[hsl(var(--buildix-primary))]">
          <History className="h-4 w-4" />
          What's New
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">Changelog</h1>
        <p className="mt-2 text-muted-foreground">
          Stay up to date with the latest features and improvements
        </p>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Button
              key={type.value}
              variant={activeType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveType(type.value)}
              className={
                activeType === type.value
                  ? "bg-[hsl(var(--buildix-primary))] hover:bg-[hsl(var(--buildix-primary))]/90"
                  : ""
              }
            >
              <Icon className="mr-1.5 h-4 w-4" />
              {type.label}
            </Button>
          );
        })}
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <History className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-medium">No updates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later for new updates
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedEntries).map(([key, group]) => (
            <div key={key}>
              {/* Month/Year Header */}
              <h2 className="mb-6 text-lg font-semibold capitalize">
                {group.label}
              </h2>

              {/* Entries */}
              <div className="space-y-8">
                {group.entries.map((entry) => {
                  const typeConfig = getTypeConfig(entry.type);
                  const TypeIcon = typeConfig.icon;

                  return (
                    <div
                      key={entry.id}
                      className="relative rounded-xl border bg-card p-6 transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Badge className={`${typeConfig.color} text-white`}>
                          <TypeIcon className="mr-1 h-3 w-3" />
                          {typeConfig.label}
                        </Badge>
                        {entry.version && (
                          <Badge variant="outline">{entry.version}</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(entry.publishedAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold">{entry.title}</h3>

                      {/* Image */}
                      {entry.imageUrl && (
                        <div className="relative mt-4 aspect-video overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={entry.imageUrl}
                            alt={entry.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Description */}
                      <div
                        className="mt-4 text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: renderDescription(entry.description),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
