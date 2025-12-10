import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { PublishProjectResponse } from "@/types/community";

// Helper to generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/-+/g, "-") // Replace multiple - with single -
    .substring(0, 50); // Limit length
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

    // Add random suffix
    const suffix = Math.random().toString(36).substring(2, 6);
    slug = `${baseSlug}-${suffix}`;
    counter++;

    // Prevent infinite loop
    if (counter > 10) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
      break;
    }
  }

  return slug;
}

// POST /api/community/publish - Publish a project to community
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.role === "admin";

    const body = await request.json();
    const { projectId, title, description, category, tags, thumbnail, allowRemix, isPro } = body;

    // Validate required fields
    if (!projectId || !title || !category) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, title, category" },
        { status: 400 }
      );
    }

    // Check if project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        publishedProject: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check ownership (if project has userId)
    if (project.userId && project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to publish this project" },
        { status: 403 }
      );
    }

    // Check if already published
    if (project.publishedProject) {
      return NextResponse.json(
        { error: "Project is already published. Use PUT to update." },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create published project
    const publishedProject = await prisma.publishedProject.create({
      data: {
        projectId,
        slug,
        title,
        description: description || null,
        category,
        tags: tags?.map((t: string) => t.toLowerCase().trim()).filter(Boolean) || [],
        thumbnail: thumbnail || project.thumbnail,
        allowRemix: allowRemix ?? true,
        isPublished: true,
        isPro: isAdmin && isPro === true, // Only admin can set isPro
        isOfficial: false,
      },
    });

    const response: PublishProjectResponse = {
      success: true,
      publishedProject: publishedProject as any,
      publicUrl: `/t/${slug}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("[Community Publish] Error:", error);
    return NextResponse.json(
      { error: "Failed to publish project" },
      { status: 500 }
    );
  }
}

// GET /api/community/publish/check-slug - Check if slug is available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    const existing = await prisma.publishedProject.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      // Generate suggestion
      const suggestion = await ensureUniqueSlug(slug);
      return NextResponse.json({
        available: false,
        suggestion,
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("[Community Publish Check] Error:", error);
    return NextResponse.json(
      { error: "Failed to check slug" },
      { status: 500 }
    );
  }
}
