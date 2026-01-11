import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Valid categories and statuses
const VALID_CATEGORIES = ["bug", "feature", "improvement", "other"] as const;
const VALID_STATUSES = ["open", "in_review", "planned", "completed", "rejected"] as const;

// GET /api/feedback - List user's feedbacks
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // Build where clause
    const where: {
      userId: string;
      status?: string;
      category?: string;
    } = {
      userId: session.user.id,
    };

    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      where.status = status;
    }

    if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      where.category = category;
    }

    // Get feedbacks with pagination
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          category: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Feedback API] Error fetching feedbacks:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}

// POST /api/feedback - Create new feedback
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { category, title, description } = body;

    // Validate required fields
    if (!category || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields: category, title, description" },
        { status: 400 }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 5 and 200 characters" },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 10 || description.length > 5000) {
      return NextResponse.json(
        { error: "Description must be between 10 and 5000 characters" },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        category,
        title: title.trim(),
        description: description.trim(),
        status: "open",
      },
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("[Feedback API] Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}
