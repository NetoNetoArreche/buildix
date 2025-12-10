import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all active assets (public API for the editor)
export async function GET() {
  try {
    const assets = await prisma.uIAsset.findMany({
      where: { isActive: true },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        category: true,
        tags: true,
        type: true,
        isPro: true,
      },
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
