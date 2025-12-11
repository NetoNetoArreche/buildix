import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - Get single changelog entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const entry = await prisma.changelogEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

// PUT - Update changelog entry
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
  const { title, version, description, type, imageUrl, isPublished, publishedAt } =
    body;

  const existing = await prisma.changelogEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const entry = await prisma.changelogEntry.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      version: version ?? existing.version,
      description: description ?? existing.description,
      type: type ?? existing.type,
      imageUrl: imageUrl ?? existing.imageUrl,
      isPublished: isPublished ?? existing.isPublished,
      publishedAt: publishedAt ? new Date(publishedAt) : existing.publishedAt,
    },
  });

  return NextResponse.json(entry);
}

// DELETE - Delete changelog entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.changelogEntry.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.changelogEntry.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
