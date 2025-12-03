import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/community/templates/[slug]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { slug, commentId } = await params;
    const userId = session.user.id;

    // Get the comment
    const comment = await prisma.projectComment.findUnique({
      where: { id: commentId },
      include: {
        publishedProject: {
          select: {
            slug: true,
            project: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!comment || comment.publishedProject.slug !== slug) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user can delete (own comment or template owner or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isOwner = comment.userId === userId;
    const isTemplateOwner = comment.publishedProject.project.userId === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isTemplateOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.projectComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Community Comment Delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
