import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      maintenanceMode: false,
      maintenanceTitle: "BuildixLab",
      maintenanceMessage: "Em breve estará disponível",
    },
  });

  console.log("Site settings initialized:", settings);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
