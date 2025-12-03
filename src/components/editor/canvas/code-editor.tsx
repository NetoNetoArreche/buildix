"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";

export function CodeEditor() {
  const { htmlContent, setHtmlContent } = useEditorStore();
  const [code, setCode] = useState(htmlContent);
  const [copied, setCopied] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync code with store
  useEffect(() => {
    setCode(htmlContent);
  }, [htmlContent]);

  // Update preview on code change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current?.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        doc.open();
        doc.write(code);
        doc.close();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [code]);

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  const handleApply = () => {
    setHtmlContent(code);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    // Basic formatting - in production you'd use Prettier
    try {
      const formatted = code
        .replace(/></g, ">\n<")
        .replace(/\n\s*\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .join("\n");
      setCode(formatted);
    } catch (e) {
      console.error("Failed to format code");
    }
  };

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);

      setCode(newValue);

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }

    // Apply changes with Cmd+S
    if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-10 items-center justify-between border-b bg-card px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Code Editor</span>
          <span className="text-xs text-muted-foreground">
            Press ⌘S to apply changes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleFormat}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Format Code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied!" : "Copy Code"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSplitView(!splitView)}
              >
                {splitView ? (
                  <Maximize2 className="h-3.5 w-3.5" />
                ) : (
                  <Minimize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {splitView ? "Full Editor" : "Split View"}
            </TooltipContent>
          </Tooltip>

          <Button
            variant="buildix"
            size="sm"
            className="ml-2 h-7"
            onClick={handleApply}
          >
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Editor and Preview */}
      <div className={cn("flex flex-1 overflow-hidden", splitView && "divide-x")}>
        {/* Code Editor */}
        <div className={cn("flex flex-col", splitView ? "w-1/2" : "w-full")}>
          <div className="flex h-8 items-center border-b bg-muted/30 px-3">
            <span className="text-xs text-muted-foreground">index.html</span>
          </div>
          <div className="relative flex-1 overflow-hidden">
            {/* Line Numbers */}
            <div className="absolute left-0 top-0 h-full w-12 select-none border-r bg-muted/30 text-right">
              <div className="p-3 font-mono text-xs leading-6 text-muted-foreground">
                {code.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="absolute inset-0 h-full w-full resize-none bg-background p-3 pl-14 font-mono text-sm leading-6 text-foreground focus:outline-none"
              spellCheck={false}
              style={{
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Preview */}
        {splitView && (
          <div className="flex w-1/2 flex-col">
            <div className="flex h-8 items-center border-b bg-muted/30 px-3">
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <iframe
                ref={iframeRef}
                className="h-full w-full border-0"
                title="Code Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
