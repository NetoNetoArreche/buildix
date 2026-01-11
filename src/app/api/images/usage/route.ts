import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getUserPlan } from "@/lib/usage";
import { getPlanLimits } from "@/lib/plans";

// GET - Get user's image upload usage
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(user.id);
    const limits = getPlanLimits(plan);

    // Count user's uploaded images
    const currentCount = await prisma.userImage.count({
      where: { userId: user.id }
    });

    // Get total storage used
    const totalSize = await prisma.userImage.aggregate({
      where: { userId: user.id },
      _sum: { size: true }
    });

    const usedBytes = totalSize._sum.size || 0;

    return NextResponse.json({
      uploads: {
        used: currentCount,
        limit: limits.imageUploadsLimit,
        remaining: limits.imageUploadsLimit === -1
          ? -1
          : Math.max(0, limits.imageUploadsLimit - currentCount),
        isUnlimited: limits.imageUploadsLimit === -1,
        isLimitReached: limits.imageUploadsLimit !== -1 && currentCount >= limits.imageUploadsLimit
      },
      storage: {
        usedBytes,
        usedMB: Math.round(usedBytes / (1024 * 1024) * 100) / 100
      },
      plan
    });
  } catch (error) {
    console.error("[Images Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to get usage info" },
      { status: 500 }
    );
  }
}
