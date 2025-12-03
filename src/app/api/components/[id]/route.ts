import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET a single component by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const component = await prisma.uIComponent.findUnique({
      where: { id },
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

    if (!component) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ component });
  } catch (error) {
    console.error("Failed to fetch component:", error);
    return NextResponse.json(
      { error: "Failed to fetch component" },
      { status: 500 }
    );
  }
}
