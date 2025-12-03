import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/community/creators/[userId]/follow - Follow a creator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId: targetUserId } = await params;
    const currentUserId = session.user.id;

    // Can't follow yourself
    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following", following: true },
        { status: 400 }
      );
    }

    // Create follow and update counters
    await prisma.$transaction([
      prisma.userFollow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { followerCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: currentUserId },
        data: { followingCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error("[Community Follow] Error:", error);
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 }
    );
  }
}

// DELETE /api/community/creators/[userId]/follow - Unfollow a creator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId: targetUserId } = await params;
    const currentUserId = session.user.id;

    // Check if following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json(
        { error: "Not following", following: false },
        { status: 400 }
      );
    }

    // Delete follow and update counters
    await prisma.$transaction([
      prisma.userFollow.delete({
        where: { id: existingFollow.id },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { followerCount: { decrement: 1 } },
      }),
      prisma.user.update({
        where: { id: currentUserId },
        data: { followingCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, following: false });
  } catch (error) {
    console.error("[Community Unfollow] Error:", error);
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    );
  }
}
