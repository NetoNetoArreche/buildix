import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/community/templates/[slug]/like - Like a template
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

    // Get template
    const template = await prisma.publishedProject.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!template || !template.isPublished) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        publishedProjectId_userId: {
          publishedProjectId: template.id,
          userId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Already liked", liked: true },
        { status: 400 }
      );
    }

    // Create like and increment counter
    await prisma.$transaction([
      prisma.projectLike.create({
        data: {
          publishedProjectId: template.id,
          userId,
        },
      }),
      prisma.publishedProject.update({
        where: { id: template.id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, liked: true });
  } catch (error) {
    console.error("[Community Like] Error:", error);
    return NextResponse.json(
      { error: "Failed to like template" },
      { status: 500 }
    );
  }
}

// DELETE /api/community/templates/[slug]/like - Unlike a template
export async function DELETE(
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

    // Get template
    const template = await prisma.publishedProject.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if liked
    const existingLike = await prisma.projectLike.findUnique({
      where: {
        publishedProjectId_userId: {
          publishedProjectId: template.id,
          userId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: "Not liked", liked: false },
        { status: 400 }
      );
    }

    // Delete like and decrement counter
    await prisma.$transaction([
      prisma.projectLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.publishedProject.update({
        where: { id: template.id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, liked: false });
  } catch (error) {
    console.error("[Community Unlike] Error:", error);
    return NextResponse.json(
      { error: "Failed to unlike template" },
      { status: 500 }
    );
  }
}
