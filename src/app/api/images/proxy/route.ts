import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Configure for handling multiple image URLs
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/images/proxy
 * Server-side proxy to fetch images and convert to base64
 * This bypasses CORS restrictions that prevent client-side fetching
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: "URLs array is required" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (urls.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 URLs per request" },
        { status: 400 }
      );
    }

    const results: Record<string, string | null> = {};

    // Process URLs in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (url: string) => {
          try {
            // Skip data URLs
            if (url.startsWith("data:")) {
              return { url, base64: url };
            }

            // Skip blob URLs (can't be fetched server-side)
            if (url.startsWith("blob:")) {
              return { url, base64: null };
            }

            // Fetch the image
            const response = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (!response.ok) {
              console.warn(`[ImageProxy] Failed to fetch ${url}: ${response.status}`);
              return { url, base64: null };
            }

            const contentType = response.headers.get("content-type") || "image/jpeg";
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const dataUrl = `data:${contentType};base64,${base64}`;

            return { url, base64: dataUrl };
          } catch (error) {
            console.warn(`[ImageProxy] Error fetching ${url}:`, error);
            return { url, base64: null };
          }
        })
      );

      for (const result of batchResults) {
        results[result.url] = result.base64;
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[ImageProxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to proxy images" },
      { status: 500 }
    );
  }
}
