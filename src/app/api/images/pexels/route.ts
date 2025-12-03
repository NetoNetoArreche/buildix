import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "background";
  const color = searchParams.get("color");
  const orientation = searchParams.get("orientation");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "30";

  // Check for API key
  if (!process.env.PEXELS_API_KEY) {
    return NextResponse.json(
      { error: "Pexels API key not configured", images: [] },
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

    const response = await fetch(
      `https://api.pexels.com/v1/search?${params}`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY,
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    // Map to standardized format
    const images = data.photos.map((img: any) => ({
      id: String(img.id),
      url: img.src.large,
      thumb: img.src.tiny,
      alt: img.alt || "Pexels image",
      width: img.width,
      height: img.height,
      author: img.photographer,
      source: "pexels",
    }));

    return NextResponse.json({ images, total: data.total_results });
  } catch (error) {
    console.error("Pexels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images from Pexels", images: [] },
      { status: 200 }
    );
  }
}
