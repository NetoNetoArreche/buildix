import { NextResponse } from "next/server";
import { getAIConfig, getEnabledModels } from "@/lib/ai-config";

/**
 * Public API to get enabled AI models
 * This is used by the frontend to show only enabled models in dropdowns
 */
export async function GET() {
  try {
    const config = await getAIConfig();
    const enabledModels = await getEnabledModels();

    return NextResponse.json({
      enabledModels,
      defaultModel: config.defaultAIModel,
    });
  } catch (error) {
    console.error("Failed to get AI config:", error);
    // Return defaults on error
    return NextResponse.json({
      enabledModels: ["gemini", "claude"],
      defaultModel: "gemini",
    });
  }
}
