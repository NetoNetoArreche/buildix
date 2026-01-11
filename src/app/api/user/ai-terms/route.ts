import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getUserPlan, canAccessProContent } from "@/lib/usage";

// GET - Check if user has accepted AI terms
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FREE plan doesn't need to accept terms
    const plan = await getUserPlan(user.id);
    if (!canAccessProContent(plan)) {
      return NextResponse.json({ required: false, accepted: true });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        aiTermsAcceptedAt: true,
        aiTermsAcceptedIp: true,
        aiTermsAcceptedUserAgent: true,
      },
    });

    return NextResponse.json({
      required: true,
      accepted: !!dbUser?.aiTermsAcceptedAt,
      acceptedAt: dbUser?.aiTermsAcceptedAt,
      acceptedIp: dbUser?.aiTermsAcceptedIp,
      acceptedUserAgent: dbUser?.aiTermsAcceptedUserAgent,
    });
  } catch (error) {
    console.error("[AI Terms] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to check AI terms status" },
      { status: 500 }
    );
  }
}

// POST - Record acceptance of AI terms with IP and User Agent for legal compliance
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Capture IP address (check various headers for proxied requests)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") || // Cloudflare
      "unknown";

    // Capture User Agent
    const userAgent = request.headers.get("user-agent") || "unknown";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        aiTermsAcceptedAt: now,
        aiTermsAcceptedIp: ip,
        aiTermsAcceptedUserAgent: userAgent,
      },
    });

    console.log(`[AI Terms] User ${user.id} accepted terms from IP: ${ip}`);

    return NextResponse.json({
      success: true,
      acceptedAt: now,
      ip,
    });
  } catch (error) {
    console.error("[AI Terms] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to accept AI terms" },
      { status: 500 }
    );
  }
}
