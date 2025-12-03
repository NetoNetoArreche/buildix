import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { CreatorProfile } from "@/types/community";

// GET /api/community/creators/[userId] - Get creator profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get current user (optional)
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Get user with stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatar: true,
        bio: true,
        website: true,
        followerCount: true,
        followingCount: true,
        // Get followers to check if current user follows
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Get template stats
    const templateStats = await prisma.publishedProject.aggregate({
      where: {
        project: { userId },
        isPublished: true,
      },
      _count: { id: true },
      _sum: {
        likeCount: true,
        remixCount: true,
      },
    });

    const profile: CreatorProfile = {
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      isFollowing: currentUserId ? (user.followers as any[])?.length > 0 : undefined,
      templateCount: templateStats._count.id,
      totalLikes: templateStats._sum.likeCount || 0,
      totalRemixes: templateStats._sum.remixCount || 0,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[Community Creator] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator profile" },
      { status: 500 }
    );
  }
}
