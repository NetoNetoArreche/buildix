import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// GET /api/projects - List user's projects with pagination
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Get total count for pagination
    const total = await prisma.project.count({ where });

    const projects = await prisma.project.findMany({
      where,
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
      skip,
      take: limit,
    });

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project (or duplicate from sourceProjectId)
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, initialPrompt, sourceProjectId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // If sourceProjectId is provided, duplicate the project
    if (sourceProjectId) {
      // Fetch the source project with all its pages
      const sourceProject = await prisma.project.findFirst({
        where: {
          id: sourceProjectId,
          userId: user.id, // Ensure user owns the source project
        },
        include: {
          pages: true,
        },
      });

      if (!sourceProject) {
        return NextResponse.json(
          { error: "Source project not found" },
          { status: 404 }
        );
      }

      // Create new project with duplicated pages
      const project = await prisma.project.create({
        data: {
          name,
          description: description ?? sourceProject.description,
          userId: user.id,
          pages: {
            create: sourceProject.pages.map((page) => ({
              name: page.name,
              slug: page.slug,
              htmlContent: page.htmlContent,
              isHome: page.isHome,
            })),
          },
        },
        include: {
          pages: true,
        },
      });

      return NextResponse.json(project, { status: 201 });
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
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 min-h-screen flex items-center justify-center">
  <div class="text-center">
    <div class="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-4 py-2 rounded-full text-sm mb-6">
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Ready to create</span>
    </div>
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">${name}</h1>
    <p class="text-zinc-400 text-lg">Use the prompt to generate your design</p>
  </div>
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
