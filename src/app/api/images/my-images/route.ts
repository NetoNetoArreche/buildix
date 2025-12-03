import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET - List user's uploaded images
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", images: [] }, { status: 401 });
    }
    const userId = user.id;

    try {
      const dbImages = await prisma.userImage.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const images = dbImages.map((img) => ({
        id: img.id,
        url: img.url,
        thumb: img.url, // Use same URL for thumb for now
        alt: img.filename,
        source: "my-images",
      }));

      return NextResponse.json({ images });
    } catch (dbError) {
      // Database not available, return empty array
      console.log("Database not available for user images:", dbError);
      return NextResponse.json({ images: [] });
    }
  } catch (error) {
    console.error("Failed to fetch user images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images", images: [] },
      { status: 200 }
    );
  }
}
