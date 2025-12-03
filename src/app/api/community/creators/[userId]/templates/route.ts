import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { TemplateSortOption } from "@/types/community";

// GET /api/community/creators/[userId]/templates - Get templates by a creator
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const sort = (searchParams.get("sort") || "recent") as TemplateSortOption;

    // Get current user (optional)
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Build orderBy
    let orderBy: any = {};
    switch (sort) {
      case "popular":
        orderBy = { likeCount: "desc" };
        break;
      case "most_remixed":
        orderBy = { remixCount: "desc" };
        break;
      case "recent":
      default:
        orderBy = { publishedAt: "desc" };
    }

    // Get total count
    const total = await prisma.publishedProject.count({
      where: {
        project: { userId },
        isPublished: true,
      },
    });

    // Get templates
    const templates = await prisma.publishedProject.findMany({
      where: {
        project: { userId },
        isPublished: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    // Transform to add isLiked field
    const templatesWithLiked = templates.map((template) => ({
      ...template,
      isLiked: currentUserId ? (template.likes as any[])?.length > 0 : false,
      likes: undefined,
    }));

    return NextResponse.json({
      templates: templatesWithLiked,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Community Creator Templates] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator templates" },
      { status: 500 }
    );
  }
}
