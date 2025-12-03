import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { captureScreenshot, isExternalServiceAvailable } from "@/lib/screenshot-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, mode, canvasData } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Verificar se o projeto pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        pages: {
          where: { isHome: true },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const homePage = project.pages[0];
    if (!homePage?.htmlContent) {
      return NextResponse.json({ error: "No content to capture" }, { status: 400 });
    }

    // Verificar se o serviço de screenshot está disponível
    if (!isExternalServiceAvailable()) {
      return NextResponse.json(
        { error: "Screenshot service not configured. Please set SCREENSHOT_SERVICE_URL environment variable." },
        { status: 503 }
      );
    }

    // Canvas Mode: Capturar composição completa com múltiplos frames
    if (mode === "canvas" && canvasData) {
      const result = await captureScreenshot({
        html: homePage.htmlContent,
        mode: "canvas",
        canvasData,
      });

      return NextResponse.json(result);
    }

    // Modo Normal: Capturar apenas o HTML
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 1200px;
      height: 900px;
      overflow: hidden;
      background: #ffffff;
    }
  </style>
</head>
<body>
${homePage.htmlContent}
</body>
</html>
    `;

    const result = await captureScreenshot({
      html: fullHtml,
      width: 1200,
      height: 900,
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Screenshot error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
