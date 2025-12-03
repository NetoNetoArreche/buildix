"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import type { AIModel } from "@/types";

export type { AIModel };

interface GenerateOptions {
  prompt: string;
  model: AIModel;
  type?: "generation" | "revision" | "revision-with-image" | "editing" | "editing-with-component" | "instagram-post" | "instagram-carousel" | "instagram-story" | "image-reference";
  currentHtml?: string;
  elementHtml?: string;
  onStream?: (chunk: string) => void;
  referenceImage?: {
    data: string; // base64 encoded image data (without data URL prefix)
    mimeType: string; // e.g., "image/png", "image/jpeg", "image/webp"
  };
}

interface UseAIReturn {
  generate: (options: GenerateOptions) => Promise<string | null>;
  isGenerating: boolean;
  error: string | null;
  streamedContent: string;
}

export function useAI(): UseAIReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const { setIsGenerating: setGlobalGenerating, setGenerationProgress } =
    useEditorStore();

  const generate = useCallback(
    async (options: GenerateOptions): Promise<string | null> => {
      const {
        prompt,
        model,
        type = "generation",
        currentHtml,
        elementHtml,
        onStream,
        referenceImage,
      } = options;

      setIsGenerating(true);
      setGlobalGenerating(true);
      setError(null);
      setStreamedContent("");
      setGenerationProgress("Connecting to AI...");

      try {
        // If streaming is requested
        if (onStream) {
          setGenerationProgress("AI is analyzing your request...");

          const response = await fetch("/api/ai/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              model,
              type,
              currentHtml,
              elementHtml,
              referenceImage,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to generate");
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();
          let fullContent = "";
          let chunkCount = 0;

          console.log("[useAI] Starting to read stream...");

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("[useAI] Stream complete, total chunks:", chunkCount);
              break;
            }

            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    chunkCount++;
                    fullContent += data.chunk;
                    setStreamedContent(fullContent);
                    onStream(data.chunk);

                    // Update progress when code starts flowing
                    if (chunkCount === 1) {
                      setGenerationProgress("Writing HTML & CSS code...");
                    }

                    // Log every 5th chunk to track progress
                    if (chunkCount % 5 === 0) {
                      console.log(`[useAI] Chunk #${chunkCount}, total length: ${fullContent.length}`);
                    }
                  }
                  if (data.done) {
                    setGenerationProgress("Complete!");
                    console.log("[useAI] Received done signal");
                  }
                  if (data.error) {
                    throw new Error(data.error);
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
            }
          }

          return fullContent;
        } else {
          // Non-streaming request
          setGenerationProgress("Generating...");

          const response = await fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              model,
              type,
              currentHtml,
              elementHtml,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to generate");
          }

          setGenerationProgress("Complete!");
          return data.html;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        setGenerationProgress("");
        console.error("AI generation error:", err);
        return null;
      } finally {
        setIsGenerating(false);
        setGlobalGenerating(false);
        setTimeout(() => setGenerationProgress(""), 2000);
      }
    },
    [setGlobalGenerating, setGenerationProgress]
  );

  return {
    generate,
    isGenerating,
    error,
    streamedContent,
  };
}
