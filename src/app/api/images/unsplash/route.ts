import { NextRequest, NextResponse } from "next/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "background";
  const color = searchParams.get("color");
  const orientation = searchParams.get("orientation");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "30";

  // Check for API key - trim to remove any whitespace
  const accessKey = process.env.UNSPLASH_ACCESS_KEY?.trim();

  if (!accessKey) {
    console.error("[Unsplash] No API key configured");
    return NextResponse.json(
      { error: "Unsplash API key not configured", images: [] },
      { status: 200 }
    );
  }

  try {
    const params = new URLSearchParams({
      query,
      page,
      per_page: perPage,
    });

    if (color) {
      params.set("color", color);
    }

    if (orientation) {
      params.set("orientation", orientation);
    }

    const apiUrl = `https://api.unsplash.com/search/photos?${params}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Unsplash] API error:", response.status, errorText);
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    // Map to standardized format
    const images = data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      alt: img.alt_description || img.description || "Unsplash image",
      width: img.width,
      height: img.height,
      author: img.user.name,
      source: "unsplash",
    }));

    return NextResponse.json({ images, total: data.total }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("Unsplash API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images from Unsplash", images: [] },
      { status: 200 }
    );
  }
}
