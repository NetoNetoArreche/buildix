import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { captureIframeScreenshots, isExternalServiceAvailable } from "@/lib/screenshot-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs array required" }, { status: 400 });
    }

    // Verificar se o serviço de screenshot está disponível
    if (!isExternalServiceAvailable()) {
      return NextResponse.json(
        { error: "Screenshot service not configured. Please set SCREENSHOT_SERVICE_URL environment variable." },
        { status: 503 }
      );
    }

    // Validar URLs permitidas (Unicorn Studio, Spline, etc.)
    const allowedDomains = [
      "unicorn.studio",
      "spline.design",
      "my.spline.design",
      "prod.spline.design",
    ];

    const validUrls = urls.filter((url: string) => {
      try {
        const parsed = new URL(url);
        return allowedDomains.some(domain => parsed.hostname.includes(domain));
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 });
    }

    const result = await captureIframeScreenshots(validUrls);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Iframe screenshot error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture iframe screenshots" },
      { status: 500 }
    );
  }
}
