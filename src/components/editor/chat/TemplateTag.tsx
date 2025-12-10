"use client";

import { Layout, X } from "lucide-react";

interface SelectedTemplate {
  id: string;
  slug: string;
  title: string;
}

interface TemplateTagProps {
  template: SelectedTemplate;
  onRemove: () => void;
}

export function TemplateTag({ template, onRemove }: TemplateTagProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-xs border border-purple-500/30">
      <Layout className="h-3 w-3 flex-shrink-0" />
      <span className="font-medium truncate max-w-[120px]">{template.title}</span>
      <span className="text-purple-400/60 hidden sm:inline">-</span>
      <span className="text-purple-400/60 hidden sm:inline">Template</span>
      <button
        onClick={onRemove}
        className="hover:text-white ml-0.5 p-0.5 hover:bg-purple-500/30 rounded transition-colors"
        aria-label={`Remove ${template.title}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
