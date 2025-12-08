import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFigmaAuthUrl } from "@/lib/figma/client";

/**
 * GET /api/figma/auth
 * Redirects user to Figma OAuth authorization page
 */
export async function GET() {
  try {
    // Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate state with user ID for security
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        timestamp: Date.now(),
      })
    ).toString("base64url");

    const authUrl = getFigmaAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Figma Auth] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Figma authentication" },
      { status: 500 }
    );
  }
}
