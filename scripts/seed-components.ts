import { PrismaClient } from "@prisma/client";
import { UI_COMPONENTS } from "../src/lib/ui-components";

const prisma = new PrismaClient();

async function seedComponents() {
  console.log("Starting component seeding...\n");

  let created = 0;
  let skipped = 0;

  for (const component of UI_COMPONENTS) {
    // Check if component already exists by name
    const existing = await prisma.uIComponent.findFirst({
      where: { name: component.name },
    });

    if (existing) {
      console.log(`⏭️  Skipped: ${component.name} (already exists)`);
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

    console.log(`✅ Created: ${component.name}`);
    created++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${UI_COMPONENTS.length}`);
}

async function main() {
  try {
    await seedComponents();
  } catch (error) {
    console.error("Error seeding components:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
