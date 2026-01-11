import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// Valid statuses and categories for filtering
const VALID_STATUSES = ["open", "in_review", "planned", "completed", "rejected"] as const;
const VALID_CATEGORIES = ["bug", "feature", "improvement", "other"] as const;

// GET /api/admin/feedback - List all feedbacks (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build where clause
    const where: {
      status?: string;
      category?: string;
      OR?: Array<{ title: { contains: string; mode: "insensitive" }; } | { description: { contains: string; mode: "insensitive" }; }>;
    } = {};

    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status;
    }

    if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get feedbacks with pagination and user info
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.feedback.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const statusCounts = stats.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        open: statusCounts["open"] || 0,
        in_review: statusCounts["in_review"] || 0,
        planned: statusCounts["planned"] || 0,
        completed: statusCounts["completed"] || 0,
        rejected: statusCounts["rejected"] || 0,
      },
    });
  } catch (error) {
    console.error("[Admin Feedback API] Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}
