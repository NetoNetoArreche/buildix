import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/ai/gemini";
import { generateWithClaude } from "@/lib/ai/claude";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = "gemini", type = "generation" } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
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
      case "insertAfter":
        // Custom system prompt already provided in body
        if (body.systemPrompt) {
          systemPrompt = body.systemPrompt;
        } else {
          systemPrompt = SYSTEM_PROMPTS.insertAfter
            .replace("{elementHtml}", body.elementHtml || "")
            .replace("{userPrompt}", prompt)
            .replace("{designContext}", body.designContext || "");
        }
        break;
      default:
        systemPrompt = SYSTEM_PROMPTS.generation;
    }

    let html: string;

    // Generate based on selected model
    if (model === "claude") {
      html = await generateWithClaude({
        prompt,
        systemPrompt,
      });
    } else {
      html = await generateWithGemini({
        prompt,
        systemPrompt,
      });
    }

    return NextResponse.json({
      html,
      model,
      success: true,
    });
  } catch (error) {
    console.error("Generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check for API key errors
    if (errorMessage.includes("API_KEY") || errorMessage.includes("apiKey")) {
      return NextResponse.json(
        {
          error: "API key not configured. Please set up your AI API keys.",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
