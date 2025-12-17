import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

const CACHE_HEADERS = {
  "Cache-Control": "private, s-maxage=60, stale-while-revalidate=300",
};

// GET - List user's uploaded images with pagination
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", images: [] }, { status: 401 });
    }
    const userId = user.id;

    // Pagination params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    try {
      const [dbImages, total] = await Promise.all([
        prisma.userImage.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.userImage.count({ where: { userId } }),
      ]);

      const images = dbImages.map((img) => ({
        id: img.id,
        url: img.url,
        thumb: img.url, // Use same URL for thumb for now
        alt: img.filename,
        source: "my-images",
      }));

      return NextResponse.json({
        images,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      }, { headers: CACHE_HEADERS });
    } catch (dbError) {
      // Database not available, return empty array
      console.log("Database not available for user images:", dbError);
      return NextResponse.json({ images: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasMore: false } });
    }
  } catch (error) {
    console.error("Failed to fetch user images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images", images: [] },
      { status: 200 }
    );
  }
}
