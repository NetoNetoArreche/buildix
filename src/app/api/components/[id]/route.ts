import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserPlan, canAccessProContent } from "@/lib/usage";

// GET a single component by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const component = await prisma.uIComponent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        code: true,
        tags: true,
        charCount: true,
        isPro: true,
      },
    });

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Check user's PRO status and include it in response
    // Code is returned for preview, but frontend blocks copying for FREE users
    const session = await auth();
    const userPlan = session?.user?.id
      ? await getUserPlan(session.user.id)
      : "FREE";
    const userHasPro = canAccessProContent(userPlan);

    return NextResponse.json({ component, userHasPro });
  } catch (error) {
    console.error("Failed to fetch component:", error);
    return NextResponse.json(
      { error: "Failed to fetch component" },
      { status: 500 }
    );
  }
}
