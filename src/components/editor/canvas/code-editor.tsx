"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Check, RefreshCw, Maximize2, Minimize2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";

export function CodeEditor() {
  const { htmlContent, setHtmlContent } = useEditorStore();
  const [code, setCode] = useState(htmlContent);
  const [copied, setCopied] = useState(false);
  const [splitView, setSplitView] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rafRef = useRef<number | null>(null);
  const { theme } = useTheme();

  // Handle resize drag with requestAnimationFrame for smooth performance
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

      // Clamp between 20% and 80%
      setEditorWidth(Math.min(80, Math.max(20, newWidth)));
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Add/remove mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  // Handle Monaco Editor mount - set up Cmd+S shortcut
  const handleEditorMount = (editor: unknown) => {
    const monacoEditor = editor as { addCommand: (keybinding: number, handler: () => void) => void };
    // Add Cmd/Ctrl+S shortcut to apply changes
    monacoEditor.addCommand(
      // KeyMod.CtrlCmd | KeyCode.KeyS
      2048 | 49, // 2048 = CtrlCmd, 49 = KeyS
      () => {
        handleApply();
      }
    );
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
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden"
      >
        {/* Code Editor */}
        <div
          className="flex flex-col"
          style={{
            width: splitView ? `${editorWidth}%` : '100%',
            willChange: isDragging ? 'width' : 'auto',
          }}
        >
          <div className="flex h-8 items-center border-b bg-muted/30 px-3">
            <span className="text-xs text-muted-foreground">index.html</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={code}
              onChange={(value) => handleCodeChange(value || "")}
              onMount={handleEditorMount}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                wordWrap: "on",
                tabSize: 2,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontLigatures: true,
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                formatOnPaste: true,
              }}
            />
          </div>
        </div>

        {/* Resizable Divider */}
        {splitView && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "flex w-2 flex-col items-center justify-center border-x bg-muted/30 cursor-col-resize hover:bg-muted/50 transition-colors select-none",
              isDragging && "bg-primary/20"
            )}
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        )}

        {/* Preview */}
        {splitView && (
          <div
            className="flex flex-col"
            style={{
              width: `${100 - editorWidth}%`,
              willChange: isDragging ? 'width' : 'auto',
            }}
          >
            <div className="flex h-8 items-center border-b bg-muted/30 px-3">
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
            <div className="flex-1 overflow-auto bg-white relative">
              <iframe
                ref={iframeRef}
                className="h-full w-full border-0"
                title="Code Preview"
                sandbox="allow-scripts allow-same-origin"
              />
              {/* Overlay to prevent iframe from capturing mouse events during resize */}
              {isDragging && (
                <div className="absolute inset-0 bg-transparent" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
