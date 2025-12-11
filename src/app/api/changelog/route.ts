import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/changelog - List all published changelog entries
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const entries = await prisma.changelogEntry.findMany({
      where: {
        isPublished: true,
        ...(type && type !== "all" ? { type } : {}),
      },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return NextResponse.json(
      { error: "Failed to fetch changelog" },
      { status: 500 }
    );
  }
}
