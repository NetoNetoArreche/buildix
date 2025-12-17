import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUseFeature, incrementUsage, getUsageLimitMessage } from "@/lib/usage";

// Admin bypass - same email used in ai/stream
const ADMIN_EMAIL = "helioarreche@gmail.com";

/**
 * POST /api/exports/html
 * Check and increment HTML export usage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isAdmin = session.user.email === ADMIN_EMAIL;

    // Admin bypass - skip usage check and increment
    if (isAdmin) {
      console.log(`[HTML Export] Admin bypass: export without usage increment`);
      return NextResponse.json({
        success: true,
        usage: { used: 0, limit: -1, remaining: Infinity },
      });
    }

    // Check usage limits for HTML exports
    const { allowed, usage, plan } = await canUseFeature(userId, "htmlExports");
    if (!allowed) {
      const message = getUsageLimitMessage("htmlExports", plan);
      return NextResponse.json(
        { error: message, usageLimit: true, usage, plan },
        { status: 429 }
      );
    }

    // Increment usage on successful export request
    await incrementUsage(userId, "htmlExports");
    console.log(`[HTML Export] Usage incremented for user ${userId}`);

    return NextResponse.json({
      success: true,
      usage: {
        used: usage.used + 1,
        limit: usage.limit,
        remaining: usage.remaining - 1,
      },
    });
  } catch (error) {
    console.error("[HTML Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to process export" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/exports/html
 * Check HTML export usage status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { allowed, usage, plan } = await canUseFeature(session.user.id, "htmlExports");

    return NextResponse.json({
      allowed,
      usage,
      plan,
    });
  } catch (error) {
    console.error("[HTML Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to get usage" },
      { status: 500 }
    );
  }
}
