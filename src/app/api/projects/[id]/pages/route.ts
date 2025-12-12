import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canCreatePage } from "@/lib/usage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/pages - List all pages for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    const pages = await prisma.page.findMany({
      where: { projectId },
      orderBy: [{ isHome: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/pages - Create a new page
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Admin bypass for limits
    const ADMIN_EMAIL = "helioarreche@gmail.com";
    const isAdmin = session.user.email === ADMIN_EMAIL;

    // Check page limit for this project (skip for admin)
    if (!isAdmin) {
      const { allowed, currentPages, limit, plan, message } = await canCreatePage(
        session.user.id,
        projectId
      );

      if (!allowed) {
        console.log(`[Pages API] User ${session.user.email} hit page limit: ${currentPages}/${limit} (${plan})`);
        return NextResponse.json(
          {
            error: message,
            usageLimit: true,
            currentPages,
            limit,
            plan,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { name, slug, htmlContent, cssContent, isHome } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists in this project
    const existingPage = await prisma.page.findUnique({
      where: {
        projectId_slug: {
          projectId,
          slug,
        },
      },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    // If this page is home, remove home status from other pages
    if (isHome) {
      await prisma.page.updateMany({
        where: { projectId, isHome: true },
        data: { isHome: false },
      });
    }

    // Use provided htmlContent (even if empty string) or fallback to default template
    // Empty string is valid - it means AI will generate the content
    const finalHtmlContent = htmlContent !== undefined && htmlContent !== null
      ? htmlContent
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <main style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <h1>${name}</h1>
  </main>
</body>
</html>`;

    const page = await prisma.page.create({
      data: {
        projectId,
        name,
        slug,
        htmlContent: finalHtmlContent,
        cssContent,
        isHome: isHome || false,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
