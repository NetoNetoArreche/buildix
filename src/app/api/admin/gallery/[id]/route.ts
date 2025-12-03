import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - Get single gallery image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const image = await prisma.buildixGalleryImage.findUnique({
    where: { id },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return NextResponse.json(image);
}

// PUT - Update gallery image
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
  const { url, thumb, alt, category, color, aspectRatio, tags, isActive } = body;

  const existing = await prisma.buildixGalleryImage.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const image = await prisma.buildixGalleryImage.update({
    where: { id },
    data: {
      url: url ?? existing.url,
      thumb: thumb ?? existing.thumb,
      alt: alt ?? existing.alt,
      category: category ?? existing.category,
      color: color ?? existing.color,
      aspectRatio: aspectRatio ?? existing.aspectRatio,
      tags: tags ?? existing.tags,
      isActive: isActive ?? existing.isActive,
    },
  });

  return NextResponse.json(image);
}

// DELETE - Delete gallery image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.buildixGalleryImage.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  await prisma.buildixGalleryImage.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
