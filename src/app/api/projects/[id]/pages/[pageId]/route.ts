import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string; pageId: string }>;
}

// GET /api/projects/[id]/pages/[pageId] - Get a single page
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, pageId } = await params;

    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        projectId,
      },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 10, // Latest 10 versions
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/pages/[pageId] - Update a page
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, pageId } = await params;
    const body = await request.json();
    const { name, slug, htmlContent, cssContent, backgroundAssets, canvasSettings, isHome, saveVersion } = body;

    // Verify page belongs to project
    const existingPage = await prisma.page.findFirst({
      where: { id: pageId, projectId },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check for slug conflict if changing slug
    if (slug && slug !== existingPage.slug) {
      const slugConflict = await prisma.page.findUnique({
        where: {
          projectId_slug: {
            projectId,
            slug,
          },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // If setting this as home, remove home status from others
    if (isHome && !existingPage.isHome) {
      await prisma.page.updateMany({
        where: { projectId, isHome: true },
        data: { isHome: false },
      });
    }

    // Optionally save a version before updating
    if (saveVersion && htmlContent !== existingPage.htmlContent) {
      await prisma.pageVersion.create({
        data: {
          pageId,
          htmlContent: existingPage.htmlContent,
          cssContent: existingPage.cssContent,
        },
      });
    }

    // Check if HTML content is changing (to invalidate prototype cache)
    const htmlChanged = htmlContent !== undefined && htmlContent !== existingPage.htmlContent;

    const page = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(cssContent !== undefined && { cssContent }),
        ...(backgroundAssets !== undefined && { backgroundAssets }),
        ...(canvasSettings !== undefined && { canvasSettings }),
        ...(isHome !== undefined && { isHome }),
        // Invalidate prototype cache if HTML changed
        ...(htmlChanged && {
          prototypeAnalysis: null,
          prototypeHtmlHash: null,
          prototypeAnalyzedAt: null,
        }),
      },
    });

    // Also update the project's updatedAt
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/pages/[pageId] - Delete a page
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId, pageId } = await params;

    // Verify page belongs to project
    const existingPage = await prisma.page.findFirst({
      where: { id: pageId, projectId },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Don't allow deleting the last page
    const pageCount = await prisma.page.count({
      where: { projectId },
    });

    if (pageCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last page" },
        { status: 400 }
      );
    }

    await prisma.page.delete({
      where: { id: pageId },
    });

    // If deleted page was home, set another as home
    if (existingPage.isHome) {
      const firstPage = await prisma.page.findFirst({
        where: { projectId },
        orderBy: { createdAt: "asc" },
      });

      if (firstPage) {
        await prisma.page.update({
          where: { id: firstPage.id },
          data: { isHome: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
