import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const category = searchParams.get("category");
  const color = searchParams.get("color");
  const aspectRatio = searchParams.get("aspectRatio");

  try {
    // Try to fetch from database first
    try {
      const dbImages = await prisma.buildixGalleryImage.findMany({
        where: {
          isActive: true,
          ...(category && { category }),
          ...(color && { color }),
          ...(aspectRatio && aspectRatio !== "all" && { aspectRatio }),
          ...(query && {
            OR: [
              { tags: { has: query.toLowerCase() } },
              { alt: { contains: query, mode: "insensitive" } },
            ],
          }),
        },
        orderBy: { createdAt: "desc" },
      });

      if (dbImages.length > 0) {
        const images = dbImages.map((img) => ({
          id: img.id,
          url: img.url,
          thumb: img.thumb || img.url,
          alt: img.alt || "Buildix gallery image",
          category: img.category,
          source: "buildix",
        }));
        return NextResponse.json({ images }, { headers: CACHE_HEADERS });
      }
    } catch (dbError) {
      // Database query failed, fall back to placeholder images
      console.log("Using placeholder images (DB not available):", dbError);
    }

    // Fallback: Placeholder images for demo
    const placeholderImages = [
      {
        id: "buildix-1",
        url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800",
        thumb: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200",
        alt: "Purple gradient background",
        category: "gradient",
        source: "buildix",
      },
      {
        id: "buildix-2",
        url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800",
        thumb: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200",
        alt: "Blue abstract shapes",
        category: "abstract",
        source: "buildix",
      },
      {
        id: "buildix-3",
        url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
        thumb: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200",
        alt: "Colorful gradient",
        category: "gradient",
        source: "buildix",
      },
      {
        id: "buildix-4",
        url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800",
        thumb: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200",
        alt: "Dark gradient",
        category: "gradient",
        source: "buildix",
      },
      {
        id: "buildix-5",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200",
        alt: "Abstract waves",
        category: "abstract",
        source: "buildix",
      },
      {
        id: "buildix-6",
        url: "https://images.unsplash.com/photo-1604076913837-52ab5f42ef63?w=800",
        thumb: "https://images.unsplash.com/photo-1604076913837-52ab5f42ef63?w=200",
        alt: "Minimal geometric",
        category: "minimal",
        source: "buildix",
      },
    ];

    // Filter by category if provided
    let filteredImages = placeholderImages;
    if (category) {
      filteredImages = placeholderImages.filter(
        (img) => img.category === category
      );
    }

    // Filter by search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredImages = filteredImages.filter(
        (img) =>
          img.alt.toLowerCase().includes(lowerQuery) ||
          img.category.includes(lowerQuery)
      );
    }

    return NextResponse.json({ images: filteredImages }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Buildix gallery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Buildix gallery", images: [] },
      { status: 200 }
    );
  }
}
