import { NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/maintenance";

/**
 * GET /api/maintenance/status
 * Retorna o status do modo manutenção (público)
 */
export async function GET() {
  try {
    const status = await getMaintenanceStatus();

    return NextResponse.json(
      {
        maintenanceMode: status.enabled,
        title: status.title,
        message: status.message,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[API] Error getting maintenance status:", error);
    return NextResponse.json(
      { error: "Failed to get maintenance status" },
      { status: 500 }
    );
  }
}
