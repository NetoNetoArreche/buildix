import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getAIConfig, updateAIConfig } from "@/lib/ai-config";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await getAIConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to get AI config:", error);
    return NextResponse.json(
      { error: "Failed to get AI configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Validate input
    const { enableGemini, enableClaude, defaultAIModel } = data;

    // Ensure at least one model is enabled
    if (enableGemini === false && enableClaude === false) {
      return NextResponse.json(
        { error: "At least one AI model must be enabled" },
        { status: 400 }
      );
    }

    // Validate default model
    if (defaultAIModel && !["gemini", "claude"].includes(defaultAIModel)) {
      return NextResponse.json(
        { error: "Invalid default AI model" },
        { status: 400 }
      );
    }

    // Ensure default model is enabled
    if (defaultAIModel === "gemini" && enableGemini === false) {
      return NextResponse.json(
        { error: "Cannot set disabled model as default" },
        { status: 400 }
      );
    }
    if (defaultAIModel === "claude" && enableClaude === false) {
      return NextResponse.json(
        { error: "Cannot set disabled model as default" },
        { status: 400 }
      );
    }

    await updateAIConfig({
      enableGemini,
      enableClaude,
      defaultAIModel,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update AI config:", error);
    return NextResponse.json(
      { error: "Failed to update AI configuration" },
      { status: 500 }
    );
  }
}
