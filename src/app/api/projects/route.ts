import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET /api/projects - List user's projects
export async function GET() {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: {
        pages: {
          select: {
            id: true,
            name: true,
            slug: true,
            isHome: true,
            htmlContent: true, // Include HTML for live preview in project cards
          },
          take: 1, // Only need the first page for preview
          orderBy: { isHome: "desc" }, // Prioritize home page
        },
        _count: {
          select: {
            pages: true,
            chatMessages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, initialPrompt } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project with a default home page
    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: user.id,
        pages: {
          create: {
            name: "Home",
            slug: "home",
            htmlContent: initialPrompt
              ? "" // Will be filled by AI generation
              : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <main style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <h1>Welcome to ${name}</h1>
  </main>
</body>
</html>`,
            isHome: true,
          },
        },
      },
      include: {
        pages: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
