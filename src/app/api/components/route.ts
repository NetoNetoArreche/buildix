import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all active components (public API for the editor)
export async function GET() {
  try {
    const components = await prisma.uIComponent.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        code: true,
        tags: true,
        charCount: true,
      },
    });

    return NextResponse.json({ components });
  } catch (error) {
    console.error("Failed to fetch components:", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}
