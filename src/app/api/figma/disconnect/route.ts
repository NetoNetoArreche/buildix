import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/figma/disconnect
 * Disconnect Figma account by clearing tokens
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear Figma tokens from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        figmaAccessToken: null,
        figmaRefreshToken: null,
        figmaTokenExpiry: null,
        figmaUserId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Figma Disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Figma" },
      { status: 500 }
    );
  }
}
