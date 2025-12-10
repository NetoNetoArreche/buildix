import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getUserUsageInfo } from "@/lib/usage";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usageInfo = await getUserUsageInfo(user.id);

    return NextResponse.json(usageInfo);
  } catch (error) {
    console.error("[User Usage] Error:", error);
    return NextResponse.json(
      { error: "Failed to get usage info" },
      { status: 500 }
    );
  }
}
