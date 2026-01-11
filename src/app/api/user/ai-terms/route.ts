import { NextResponse } from "next/server";
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
      select: { aiTermsAcceptedAt: true },
    });

    return NextResponse.json({
      required: true,
      accepted: !!dbUser?.aiTermsAcceptedAt,
      acceptedAt: dbUser?.aiTermsAcceptedAt,
    });
  } catch (error) {
    console.error("[AI Terms] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to check AI terms status" },
      { status: 500 }
    );
  }
}

// POST - Record acceptance of AI terms
export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: { aiTermsAcceptedAt: now },
    });

    return NextResponse.json({ success: true, acceptedAt: now });
  } catch (error) {
    console.error("[AI Terms] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to accept AI terms" },
      { status: 500 }
    );
  }
}
