import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tutorials - List all published tutorials
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const tutorials = await prisma.tutorial.findMany({
      where: {
        isPublished: true,
        ...(category && category !== "all" ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        videoUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(tutorials);
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutorials" },
      { status: 500 }
    );
  }
}
