import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { PublishProjectRequest } from "@/types/community";

// Helper to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

// Helper to ensure unique slug
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.publishedProject.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    const suffix = Math.random().toString(36).substring(2, 6);
    slug = `${baseSlug}-${suffix}`;
    counter++;

    if (counter > 10) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
      break;
    }
  }

  return slug;
}

// PUT /api/community/publish/[id] - Update a published project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get published project
    const publishedProject = await prisma.publishedProject.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!publishedProject) {
      return NextResponse.json(
        { error: "Published project not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (publishedProject.project.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return NextResponse.json(
          { error: "You don't have permission to update this project" },
          { status: 403 }
        );
      }
    }

    const body: Partial<PublishProjectRequest> = await request.json();
    const { title, description, category, tags, thumbnail, allowRemix } = body;

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changed
      const baseSlug = generateSlug(title);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (tags !== undefined) {
      updateData.tags = tags.map((t) => t.toLowerCase().trim()).filter(Boolean);
    }

    if (thumbnail !== undefined) {
      updateData.thumbnail = thumbnail || null;
    }

    if (allowRemix !== undefined) {
      updateData.allowRemix = allowRemix;
    }

    // Update
    const updated = await prisma.publishedProject.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      publishedProject: updated,
      publicUrl: `/t/${updated.slug}`,
    });
  } catch (error) {
    console.error("[Community Publish Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to update published project" },
      { status: 500 }
    );
  }
}

// DELETE /api/community/publish/[id] - Unpublish a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get published project
    const publishedProject = await prisma.publishedProject.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!publishedProject) {
      return NextResponse.json(
        { error: "Published project not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (publishedProject.project.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== "admin") {
        return NextResponse.json(
          { error: "You don't have permission to unpublish this project" },
          { status: 403 }
        );
      }
    }

    // Delete published project (cascades to likes and comments)
    await prisma.publishedProject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Community Unpublish] Error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish project" },
      { status: 500 }
    );
  }
}
