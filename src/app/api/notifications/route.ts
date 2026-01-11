import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/notifications - List user's notifications
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
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    // Get user-specific notifications + global notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isGlobal: true },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        readBy: {
          where: { userId: session.user.id },
          select: { readAt: true },
        },
      },
    });

    // Transform to include isRead flag
    const transformedNotifications = notifications.map((notif) => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      isGlobal: notif.isGlobal,
      createdAt: notif.createdAt,
      isRead: notif.readBy.length > 0,
      readAt: notif.readBy[0]?.readAt || null,
    }));

    // Filter unread if requested
    const result = unreadOnly
      ? transformedNotifications.filter((n) => !n.isRead)
      : transformedNotifications;

    // Count unread
    const unreadCount = transformedNotifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: result,
      unreadCount,
    });
  } catch (error) {
    console.error("[Notifications API] Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
