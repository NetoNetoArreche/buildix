import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/community/templates/[slug] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get current user (optional - for checking liked status)
    const session = await auth();
    const userId = session?.user?.id;

    // Get template with full details
    const template = await prisma.publishedProject.findUnique({
      where: { slug },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
                bio: true,
                followerCount: true,
              },
            },
            pages: {
              select: {
                id: true,
                name: true,
                slug: true,
                htmlContent: true,
                cssContent: true,
                isHome: true,
              },
              orderBy: [{ isHome: "desc" }, { name: "asc" }],
            },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        // Check if current user liked
        likes: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if published
    if (!template.isPublished) {
      return NextResponse.json(
        { error: "Template is not published" },
        { status: 404 }
      );
    }

    // Increment view count (async, don't wait)
    prisma.publishedProject
      .update({
        where: { id: template.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(console.error);

    // Transform response
    const response = {
      ...template,
      isLiked: userId ? template.likes?.length > 0 : false,
      likes: undefined, // Remove likes array
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Community Template Detail] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}
