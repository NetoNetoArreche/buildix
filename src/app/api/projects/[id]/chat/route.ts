import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/chat - Get chat history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/chat - Add a chat message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { role, content, model, generatedHtml } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        projectId,
        role,
        content,
        model,
        generatedHtml,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating chat message:", error);
    return NextResponse.json(
      { error: "Failed to create chat message" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/chat - Clear chat history
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    await prisma.chatMessage.deleteMany({
      where: { projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat messages:", error);
    return NextResponse.json(
      { error: "Failed to clear chat messages" },
      { status: 500 }
    );
  }
}
