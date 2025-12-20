import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Default categories that should always exist
const DEFAULT_CATEGORIES = [
  { slug: "hero", name: "Hero" },
  { slug: "feature", name: "Features" },
  { slug: "cta", name: "CTA" },
  { slug: "pricing", name: "Pricing" },
  { slug: "testimonial", name: "Testimonials" },
  { slug: "footer", name: "Footer" },
  { slug: "navbar", name: "Navbar" },
  { slug: "card", name: "Cards" },
  { slug: "form", name: "Forms" },
  { slug: "gallery", name: "Gallery" },
];

// GET - List all categories
export async function GET() {
  try {
    // Ensure default categories exist
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.componentCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: {
          slug: cat.slug,
          name: cat.name,
          isDefault: true,
        },
      });
    }

    // Also check if there are categories used in components but not in the table
    const componentsWithCategories = await prisma.uIComponent.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    for (const comp of componentsWithCategories) {
      const exists = await prisma.componentCategory.findUnique({
        where: { slug: comp.category },
      });

      if (!exists) {
        // Category exists in components but not in categories table - add it
        await prisma.componentCategory.create({
          data: {
            slug: comp.category,
            name: comp.category.charAt(0).toUpperCase() + comp.category.slice(1).replace(/-/g, " "),
            isDefault: false,
          },
        });
      }
    }

    // Fetch all categories
    const categories = await prisma.componentCategory.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!slug) {
      return NextResponse.json(
        { error: "Invalid category name" },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.componentCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category already exists", category: existing },
        { status: 409 }
      );
    }

    // Create the category
    const category = await prisma.componentCategory.create({
      data: {
        slug,
        name: name.trim(),
        isDefault: false,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
