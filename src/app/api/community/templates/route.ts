import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type {
  ListTemplatesParams,
  ListTemplatesResponse,
  TemplateSortOption,
  TemplateTypeFilter,
} from "@/types/community";

// GET /api/community/templates - List all published templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = (searchParams.get("sort") || "recent") as TemplateSortOption;
    const type = (searchParams.get("type") || "all") as TemplateTypeFilter;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    // Get current user (optional - for checking liked status)
    const session = await auth();
    const userId = session?.user?.id;

    // Build where clause
    const where: any = {
      isPublished: true,
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by type
    if (type === "community") {
      where.isOfficial = false;
      where.isPro = false;
    } else if (type === "official") {
      where.isOfficial = true;
    } else if (type === "pro") {
      where.isPro = true;
    }

    // Filter by tags
    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Search in title, description, and tags
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

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
    const total = await prisma.publishedProject.count({ where });

    // Get templates with author info
    const templates = await prisma.publishedProject.findMany({
      where,
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
        // Check if current user liked (if logged in)
        likes: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    // Transform to add isLiked field
    const templatesWithLiked = templates.map((template) => ({
      ...template,
      isLiked: userId ? template.likes?.length > 0 : false,
      likes: undefined, // Remove likes array from response
    }));

    const response: ListTemplatesResponse = {
      templates: templatesWithLiked as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Community Templates] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
