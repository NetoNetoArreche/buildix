import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - List all tutorials (admin)
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tutorials, total] = await Promise.all([
    prisma.tutorial.findMany({
      where,
      orderBy: [{ category: "asc" }, { order: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tutorial.count({ where }),
  ]);

  return NextResponse.json({
    tutorials,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Create new tutorial
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!title || !slug || !category || !content) {
    return NextResponse.json(
      { error: "Title, slug, category, and content are required" },
      { status: 400 }
    );
  }

  // Check if slug already exists
  const existing = await prisma.tutorial.findUnique({
    where: { slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A tutorial with this slug already exists" },
      { status: 400 }
    );
  }

  const tutorial = await prisma.tutorial.create({
    data: {
      title,
      slug,
      description,
      content,
      videoUrl,
      thumbnail,
      category,
      order: order || 0,
      isPublished: isPublished || false,
    },
  });

  return NextResponse.json(tutorial, { status: 201 });
}
