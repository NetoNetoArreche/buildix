import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

// GET - List all users with pagination and filters
export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const role = searchParams.get("role");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};

  if (role && role !== "all") {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get first day of current month for usage query
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // AI Terms acceptance fields (for refund compliance)
        aiTermsAcceptedAt: true,
        aiTermsAcceptedIp: true,
        aiTermsAcceptedUserAgent: true,
        _count: {
          select: {
            projects: true,
            images: true,
          },
        },
        // Subscription info
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
        // Current month usage
        usages: {
          where: {
            periodStart: { gte: startOfMonth },
          },
          select: {
            promptsUsed: true,
            imagesGenerated: true,
          },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Map users to include plan and usage info
  const mappedUsers = users.map((user) => ({
    ...user,
    plan: user.subscription?.status === "ACTIVE" ? user.subscription.plan : "FREE",
    promptsUsed: user.usages[0]?.promptsUsed || 0,
    imagesGenerated: user.usages[0]?.imagesGenerated || 0,
  }));

  return NextResponse.json({
    users: mappedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
