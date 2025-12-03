import { NextRequest } from "next/server";
import { streamWithGemini } from "@/lib/ai/gemini";
import { streamWithClaude } from "@/lib/ai/claude";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = "gemini", type = "generation", referenceImage } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Select system prompt based on type
    let systemPrompt: string;
    switch (type) {
      case "generation":
        systemPrompt = SYSTEM_PROMPTS.generation;
        break;
      case "revision":
        systemPrompt = SYSTEM_PROMPTS.revision.replace(
          "{currentHtml}",
          body.currentHtml || ""
        );
        break;
      case "revision-with-image":
        // Revision with image reference - uses existing HTML + image for inspiration
        systemPrompt = SYSTEM_PROMPTS.revisionWithImage.replace(
          "{currentHtml}",
          body.currentHtml || ""
        );
        console.log("[Stream API] Using revision-with-image prompt (preserving existing HTML)");
        break;
      case "editing":
        systemPrompt = SYSTEM_PROMPTS.editing.replace(
          "{elementHtml}",
          body.elementHtml || ""
        );
        break;
      case "editing-with-component":
        systemPrompt = SYSTEM_PROMPTS.editingWithComponent.replace(
          "{elementHtml}",
          body.elementHtml || ""
        );
        break;
      // Instagram content types
      case "instagram-post":
        systemPrompt = SYSTEM_PROMPTS.instagramPost;
        break;
      case "instagram-carousel":
        systemPrompt = SYSTEM_PROMPTS.instagramCarousel;
        break;
      case "instagram-story":
        systemPrompt = SYSTEM_PROMPTS.instagramStory;
        break;
      // Image reference type - for NEW generation from image (no existing HTML)
      case "image-reference":
        systemPrompt = SYSTEM_PROMPTS.imageReference;
        break;
      default:
        systemPrompt = SYSTEM_PROMPTS.generation;
    }

    // NOTE: We no longer auto-override to imageReference when referenceImage is present
    // The client now explicitly sends the correct type:
    // - "image-reference" for new generation from image
    // - "revision-with-image" for editing existing page with image reference
    // This ensures we preserve the existing HTML when doing revisions

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();

    let chunkCount = 0;
    console.log("[Stream API] Starting stream for model:", model);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator =
            model === "claude"
              ? streamWithClaude({ prompt, systemPrompt, referenceImage })
              : streamWithGemini({ prompt, systemPrompt, referenceImage });

          for await (const chunk of generator) {
            chunkCount++;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));

            // Log progress
            if (chunkCount % 10 === 0) {
              console.log(`[Stream API] Sent chunk #${chunkCount}, size: ${chunk.length}`);
            }
          }

          console.log(`[Stream API] Stream complete. Total chunks: ${chunkCount}`);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error("[Stream API] Error during streaming:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({ error: "Failed to start streaming", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
