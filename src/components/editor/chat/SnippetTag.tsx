"use client";

import { Code2, X } from "lucide-react";
import type { SelectedSnippet } from "@/lib/code-snippets";

interface SnippetTagProps {
  snippet: SelectedSnippet;
  onRemove: () => void;
}

export function SnippetTag({ snippet, onRemove }: SnippetTagProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-violet-500/20 text-violet-400 px-2 py-1 rounded-md text-xs border border-violet-500/30">
      <Code2 className="h-3 w-3 flex-shrink-0" />
      <span className="font-medium truncate max-w-[120px]">{snippet.name}</span>
      <span className="text-violet-400/60 hidden sm:inline">-</span>
      <span className="text-violet-400/60 hidden sm:inline">Code Snippet</span>
      <span className="text-violet-400/60">-</span>
      <span className="text-violet-400/60">
        {(snippet.charCount / 1000).toFixed(1)}K
      </span>
      <button
        onClick={onRemove}
        className="hover:text-white ml-0.5 p-0.5 hover:bg-violet-500/30 rounded transition-colors"
        aria-label={`Remove ${snippet.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
