import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - List all components
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
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [components, total] = await Promise.all([
    prisma.uIComponent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.uIComponent.count({ where }),
  ]);

  return NextResponse.json({
    components,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Create new component
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, category, code, tags, isPro } = body;

  if (!name || !category || !code) {
    return NextResponse.json(
      { error: "Name, category, and code are required" },
      { status: 400 }
    );
  }

  const component = await prisma.uIComponent.create({
    data: {
      name,
      description,
      category,
      code,
      tags: tags || [],
      charCount: code.length,
      isPro: isPro || false,
      isActive: true,
    },
  });

  return NextResponse.json(component, { status: 201 });
}
