import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - List all changelog entries (admin)
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.changelogEntry.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.changelogEntry.count({ where }),
  ]);

  return NextResponse.json({
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Create new changelog entry
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, version, description, type, imageUrl, isPublished, publishedAt } =
    body;

  if (!title || !description || !type) {
    return NextResponse.json(
      { error: "Title, description, and type are required" },
      { status: 400 }
    );
  }

  const entry = await prisma.changelogEntry.create({
    data: {
      title,
      version,
      description,
      type,
      imageUrl,
      isPublished: isPublished || false,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
