import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tutorials/[slug] - Get single tutorial by slug
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const tutorial = await prisma.tutorial.findUnique({
      where: { slug, isPublished: true },
    });

    if (!tutorial) {
      return NextResponse.json(
        { error: "Tutorial not found" },
        { status: 404 }
      );
    }

    // Get prev/next tutorials for navigation
    const [prevTutorial, nextTutorial] = await Promise.all([
      prisma.tutorial.findFirst({
        where: {
          isPublished: true,
          OR: [
            { category: tutorial.category, order: { lt: tutorial.order } },
            {
              category: { lt: tutorial.category },
            },
          ],
        },
        orderBy: [{ category: "desc" }, { order: "desc" }],
        select: { slug: true, title: true },
      }),
      prisma.tutorial.findFirst({
        where: {
          isPublished: true,
          OR: [
            { category: tutorial.category, order: { gt: tutorial.order } },
            {
              category: { gt: tutorial.category },
            },
          ],
        },
        orderBy: [{ category: "asc" }, { order: "asc" }],
        select: { slug: true, title: true },
      }),
    ]);

    return NextResponse.json({
      ...tutorial,
      prevTutorial,
      nextTutorial,
    });
  } catch (error) {
    console.error("Error fetching tutorial:", error);
    return NextResponse.json(
      { error: "Failed to fetch tutorial" },
      { status: 500 }
    );
  }
}
