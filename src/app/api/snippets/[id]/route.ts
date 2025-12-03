import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET a single snippet by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const snippet = await prisma.codeSnippet.findUnique({
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

    if (!snippet) {
      return NextResponse.json(
        { error: "Snippet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ snippet });
  } catch (error) {
    console.error("Failed to fetch snippet:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippet" },
      { status: 500 }
    );
  }
}
