import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getUserPlan, canAccessProContent } from "@/lib/usage";

// GET /api/components - List all active UI components
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isPro = searchParams.get("isPro");

    // Check user's plan to determine PRO access
    const session = await auth();
    const userPlan = session?.user?.id
      ? await getUserPlan(session.user.id)
      : "FREE";
    const hasPro = canAccessProContent(userPlan);

    const components = await prisma.uIComponent.findMany({
      where: {
        isActive: true,
        ...(category && category !== "all" ? { category } : {}),
        ...(isPro === "true" ? { isPro: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { tags: { hasSome: [search.toLowerCase()] } },
              ],
            }
          : {}),
      },
      orderBy: [{ isPro: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        code: true,
        tags: true,
        isPro: true,
        charCount: true,
        createdAt: true,
      },
    });

    // Return all components with code for preview, but mark which ones user can copy
    // The frontend will block copying for PRO components if user doesn't have PRO plan
    return NextResponse.json({ components, userHasPro: hasPro });
  } catch (error) {
    console.error("Error fetching components:", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}
