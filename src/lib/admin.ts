import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

export async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "admin";
}

export async function getAdminSession() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return session;
}
