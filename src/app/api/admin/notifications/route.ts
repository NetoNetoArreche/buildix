import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// Valid notification types
const VALID_TYPES = ["changelog", "admin_notice", "feedback_reply", "system"] as const;

// GET /api/admin/notifications - List all notifications (admin only)
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
    const type = searchParams.get("type");

    // Build where clause
    const where: { type?: string } = {};

    if (type && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      where.type = type;
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
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
            },
          },
          _count: {
            select: { readBy: true },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    // Get stats by type
    const stats = await prisma.notification.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    const typeCounts = stats.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isGlobal: n.isGlobal,
        userId: n.userId,
        user: n.user,
        readCount: n._count.readBy,
        createdAt: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total,
        changelog: typeCounts["changelog"] || 0,
        admin_notice: typeCounts["admin_notice"] || 0,
        feedback_reply: typeCounts["feedback_reply"] || 0,
        system: typeCounts["system"] || 0,
      },
    });
  } catch (error) {
    console.error("[Admin Notifications API] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications - Create new notification (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, title, message, link, userId, isGlobal } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, message" },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length < 3 || title.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 3 and 200 characters" },
        { status: 400 }
      );
    }

    // Must specify either userId or isGlobal
    if (!userId && !isGlobal) {
      return NextResponse.json(
        { error: "Must specify either userId or isGlobal: true" },
        { status: 400 }
      );
    }

    // If userId specified, verify user exists
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title: title.trim(),
        message: message.trim(),
        link: link?.trim() || null,
        userId: isGlobal ? null : userId,
        isGlobal: isGlobal || false,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("[Admin Notifications API] Error creating:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
