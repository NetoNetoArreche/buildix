import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CODE_SNIPPETS } from "@/lib/code-snippets";
import { staticCodeSnippets } from "@/data/code-snippets";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let created = 0;
    let skipped = 0;

    // Combine both existing snippets and static snippets
    const allSnippets = [
      ...CODE_SNIPPETS.map((s) => ({
        name: s.name,
        description: s.description,
        category: s.category,
        code: s.code,
        tags: s.tags,
        charCount: s.charCount,
      })),
      ...staticCodeSnippets,
    ];

    for (const snippet of allSnippets) {
      // Check if snippet with same name already exists
      const existing = await prisma.codeSnippet.findFirst({
        where: { name: snippet.name },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.codeSnippet.create({
        data: {
          name: snippet.name,
          description: snippet.description,
          category: snippet.category,
          code: snippet.code,
          tags: snippet.tags,
          charCount: snippet.code.length,
          isActive: true,
        },
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: allSnippets.length,
        created,
        skipped,
      },
    });
  } catch (error) {
    console.error("Failed to seed snippets:", error);
    return NextResponse.json(
      { error: "Failed to seed snippets" },
      { status: 500 }
    );
  }
}
