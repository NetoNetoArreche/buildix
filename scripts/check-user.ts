import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkUser() {
  const email = "helioarreche@gmail.com";
  const testPassword = "30032384";

  console.log("=== Diagnóstico de Login ===\n");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  console.log("");

  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true },
  });

  if (!user) {
    console.log("❌ Usuário NÃO encontrado:", email);
    await prisma.$disconnect();
    return;
  }

  console.log("✅ Usuário encontrado:");
  console.log("   ID:", user.id);
  console.log("   Email:", user.email);
  console.log("   Nome:", user.name);
  console.log("   Tem senha?", user.password ? "SIM" : "NÃO");

  if (user.password) {
    console.log("   Hash da senha (primeiros 30 chars):", user.password.substring(0, 30) + "...");
    console.log("");

    // Testar a senha
    console.log(`Testando senha "${testPassword}"...`);
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log("Resultado:", isValid ? "✅ SENHA CORRETA" : "❌ SENHA INCORRETA");

    if (!isValid) {
      console.log("\n💡 A senha no banco não corresponde a '30032384'");
      console.log("   Você precisa resetar a senha ou usar a senha correta.");
    }
  } else {
    console.log("\n❌ Usuário não tem senha definida (provavelmente criado via OAuth)");
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
