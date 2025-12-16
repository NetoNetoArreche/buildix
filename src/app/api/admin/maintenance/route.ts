import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import {
  getMaintenanceStatus,
  updateMaintenanceSettings,
} from "@/lib/maintenance";

/**
 * GET /api/admin/maintenance
 * Retorna as configurações de manutenção (admin only)
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getMaintenanceStatus();

    return NextResponse.json({
      maintenanceMode: status.enabled,
      title: status.title,
      message: status.message,
    });
  } catch (error) {
    console.error("[Admin API] Error getting maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to get maintenance settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/maintenance
 * Atualiza as configurações de manutenção (admin only)
 */
export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { maintenanceMode, title, message } = body;

    if (typeof maintenanceMode !== "boolean") {
      return NextResponse.json(
        { error: "maintenanceMode must be a boolean" },
        { status: 400 }
      );
    }

    const status = await updateMaintenanceSettings(
      maintenanceMode,
      title,
      message,
      session.user?.id
    );

    return NextResponse.json({
      success: true,
      maintenanceMode: status.enabled,
      title: status.title,
      message: status.message,
    });
  } catch (error) {
    console.error("[Admin API] Error updating maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance settings" },
      { status: 500 }
    );
  }
}
