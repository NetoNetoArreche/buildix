import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUseFeature, incrementUsage, getUsageLimitMessage } from "@/lib/usage";

// Configure body size limit for large HTML with base64 images
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CODE_TO_DESIGN_API = "https://api.to.design/html";

/**
 * POST /api/figma/export
 * Convert HTML to Figma clipboard format using code.to.design API
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check usage limits for Figma exports
    const { allowed, usage, plan } = await canUseFeature(userId, "figmaExports");
    if (!allowed) {
      const message = getUsageLimitMessage("figmaExports", plan);
      return NextResponse.json(
        { error: message, usageLimit: true, usage, plan },
        { status: 429 }
      );
    }

    // Check if user is on FREE plan (no Figma exports allowed)
    if (plan === "FREE") {
      return NextResponse.json(
        {
          error: "O plano Free não inclui exports para Figma. Faça upgrade para acessar esta funcionalidade!",
          usageLimit: true,
          usage,
          plan
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { html } = body;

    if (!html) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    // Get the API key from environment
    const apiKey = process.env.CODE_TO_DESIGN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "code.to.design API key not configured" },
        { status: 500 }
      );
    }

    // Call code.to.design API to convert HTML to Figma clipboard format
    const response = await fetch(CODE_TO_DESIGN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        html: html,
        clip: true, // Request clipboard format
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Figma Export] code.to.design API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Failed to convert: ${errorText}` },
        { status: response.status }
      );
    }

    // The API returns the clipboard data as text/html
    const clipboardData = await response.text();

    // Increment usage on successful export
    await incrementUsage(userId, "figmaExports");
    console.log(`[Figma Export] Usage incremented for user ${userId}`);

    return NextResponse.json({
      success: true,
      clipboardData,
    });
  } catch (error) {
    console.error("[Figma Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export to Figma" },
      { status: 500 }
    );
  }
}
