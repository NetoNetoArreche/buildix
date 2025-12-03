import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all active snippets (public API for the editor)
export async function GET() {
  try {
    const snippets = await prisma.codeSnippet.findMany({
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

    return NextResponse.json({ snippets });
  } catch (error) {
    console.error("Failed to fetch snippets:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}
