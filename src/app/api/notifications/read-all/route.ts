import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get all unread notifications for this user (user-specific + global)
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { isGlobal: true },
        ],
      },
      select: { id: true },
    });

    // Get already read notification IDs
    const alreadyRead = await prisma.notificationRead.findMany({
      where: {
        userId: session.user.id,
        notificationId: { in: notifications.map((n) => n.id) },
      },
      select: { notificationId: true },
    });

    const alreadyReadIds = new Set(alreadyRead.map((r) => r.notificationId));

    // Filter to only unread notifications
    const unreadNotifications = notifications.filter(
      (n) => !alreadyReadIds.has(n.id)
    );

    // Create read records for all unread notifications
    if (unreadNotifications.length > 0) {
      await prisma.notificationRead.createMany({
        data: unreadNotifications.map((n) => ({
          notificationId: n.id,
          userId: session.user.id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      markedAsRead: unreadNotifications.length,
    });
  } catch (error) {
    console.error("[Notifications API] Error marking all as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
