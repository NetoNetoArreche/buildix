import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - Get single tutorial
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tutorial = await prisma.tutorial.findUnique({
    where: { id },
  });

  if (!tutorial) {
    return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  }

  return NextResponse.json(tutorial);
}

// PUT - Update tutorial
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    slug,
    description,
    content,
    videoUrl,
    thumbnail,
    category,
    order,
    isPublished,
  } = body;

  const existing = await prisma.tutorial.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  }

  // Check if new slug conflicts with another tutorial
  if (slug && slug !== existing.slug) {
    const slugConflict = await prisma.tutorial.findUnique({
      where: { slug },
    });
    if (slugConflict) {
      return NextResponse.json(
        { error: "A tutorial with this slug already exists" },
        { status: 400 }
      );
    }
  }

  const tutorial = await prisma.tutorial.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      slug: slug ?? existing.slug,
      description: description ?? existing.description,
      content: content ?? existing.content,
      videoUrl: videoUrl ?? existing.videoUrl,
      thumbnail: thumbnail ?? existing.thumbnail,
      category: category ?? existing.category,
      order: order ?? existing.order,
      isPublished: isPublished ?? existing.isPublished,
    },
  });

  return NextResponse.json(tutorial);
}

// DELETE - Delete tutorial
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.tutorial.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
  }

  await prisma.tutorial.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
