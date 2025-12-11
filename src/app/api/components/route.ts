import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/components - List all active UI components (public)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isPro = searchParams.get("isPro");

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

    return NextResponse.json({ components });
  } catch (error) {
    console.error("Error fetching components:", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}
