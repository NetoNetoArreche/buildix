import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { RemixResponse } from "@/types/community";

// POST /api/community/templates/[slug]/remix - Remix (clone) a template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const userId = session.user.id;

    // Get template with full project data
    const template = await prisma.publishedProject.findUnique({
      where: { slug },
      include: {
        project: {
          include: {
            pages: true,
          },
        },
      },
    });

    if (!template || !template.isPublished) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if remix is allowed
    if (!template.allowRemix) {
      return NextResponse.json(
        { error: "This template does not allow remixing" },
        { status: 403 }
      );
    }

    // Check if PRO template and user has access
    if (template.isPro) {
      // TODO: Check if user has PRO subscription
      // For now, just check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return NextResponse.json(
          { error: "PRO subscription required to remix this template" },
          { status: 403 }
        );
      }
    }

    // Create new project as a copy
    const newProject = await prisma.project.create({
      data: {
        name: `${template.project.name} (Remix)`,
        description: template.project.description,
        thumbnail: template.project.thumbnail,
        userId,
        pages: {
          create: template.project.pages.map((page) => ({
            name: page.name,
            slug: page.slug,
            htmlContent: page.htmlContent,
            cssContent: page.cssContent,
            backgroundAssets: page.backgroundAssets,
            isHome: page.isHome,
          })),
        },
      },
    });

    // Increment remix count
    await prisma.publishedProject.update({
      where: { id: template.id },
      data: { remixCount: { increment: 1 } },
    });

    const response: RemixResponse = {
      success: true,
      newProjectId: newProject.id,
      redirectUrl: `/editor/${newProject.id}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[Community Remix] Error:", error);
    return NextResponse.json(
      { error: "Failed to remix template" },
      { status: 500 }
    );
  }
}
