import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { FeedbackButtonWrapper } from "@/components/feedback";
import { auth } from "@/lib/auth";
import { isMaintenanceMode } from "@/lib/maintenance";

export default async function DashboardLayout({
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
      <FeedbackButtonWrapper />
    </div>
  );
}
