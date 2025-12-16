import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isMaintenanceMode } from "@/lib/maintenance";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check maintenance mode - redirect non-admin users
  const [session, maintenanceEnabled] = await Promise.all([
    auth(),
    isMaintenanceMode(),
  ]);

  const isAdmin = session?.user?.role === "admin";

  if (maintenanceEnabled && !isAdmin) {
    redirect("/coming-soon");
  }

  return <div className="h-screen overflow-hidden">{children}</div>;
}
