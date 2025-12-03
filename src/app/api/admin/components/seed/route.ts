import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { UI_COMPONENTS } from "@/lib/ui-components";

// POST - Seed components from static files
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  let skipped = 0;
  const results: { name: string; status: "created" | "skipped" }[] = [];

  for (const component of UI_COMPONENTS) {
    // Check if component already exists by name
    const existing = await prisma.uIComponent.findFirst({
      where: { name: component.name },
    });

    if (existing) {
      results.push({ name: component.name, status: "skipped" });
      skipped++;
      continue;
    }

    // Create the component
    await prisma.uIComponent.create({
      data: {
        name: component.name,
        description: component.description || null,
        category: component.category,
        code: component.code,
        tags: component.tags || [],
        charCount: component.charCount || component.code.length,
        isPro: false,
        isActive: true,
      },
    });

    results.push({ name: component.name, status: "created" });
    created++;
  }

  return NextResponse.json({
    success: true,
    summary: {
      created,
      skipped,
      total: UI_COMPONENTS.length,
    },
    results,
  });
}
