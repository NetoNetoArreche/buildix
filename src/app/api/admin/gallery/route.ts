import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - List all gallery images
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const aspectRatio = searchParams.get("aspectRatio");
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "24");

  const where: any = {};

  if (category && category !== "all") {
    where.category = category;
  }

  if (aspectRatio && aspectRatio !== "all") {
    where.aspectRatio = aspectRatio;
  }

  if (isActive && isActive !== "all") {
    where.isActive = isActive === "true";
  }

  if (search) {
    where.OR = [
      { alt: { contains: search, mode: "insensitive" } },
      { tags: { hasSome: [search] } },
    ];
  }

  const [images, total] = await Promise.all([
    prisma.buildixGalleryImage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.buildixGalleryImage.count({ where }),
  ]);

  return NextResponse.json({
    images,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Create new gallery image
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { url, thumb, alt, category, color, aspectRatio, tags } = body;

  if (!url || !category) {
    return NextResponse.json(
      { error: "URL and category are required" },
      { status: 400 }
    );
  }

  const image = await prisma.buildixGalleryImage.create({
    data: {
      url,
      thumb: thumb || null,
      alt: alt || null,
      category,
      color: color || null,
      aspectRatio: aspectRatio || null,
      tags: tags || [],
      isActive: true,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
