import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - Get single component
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const component = await prisma.uIComponent.findUnique({
    where: { id },
  });

  if (!component) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }

  return NextResponse.json(component);
}

// PUT - Update component
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
  const { name, description, category, code, tags, isPro, isActive } = body;

  const existing = await prisma.uIComponent.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }

  const component = await prisma.uIComponent.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      description: description ?? existing.description,
      category: category ?? existing.category,
      code: code ?? existing.code,
      tags: tags ?? existing.tags,
      charCount: code ? code.length : existing.charCount,
      isPro: isPro ?? existing.isPro,
      isActive: isActive ?? existing.isActive,
    },
  });

  return NextResponse.json(component);
}

// DELETE - Delete component
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.uIComponent.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }

  await prisma.uIComponent.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
