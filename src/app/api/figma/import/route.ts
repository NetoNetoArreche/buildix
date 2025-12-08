import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { FigmaClient, parseFigmaUrl, refreshAccessToken } from "@/lib/figma/client";
import { figmaToHtml, ConversionOptions } from "@/lib/figma/figma-to-html";

interface ImportRequest {
  figmaUrl: string;
  options?: Partial<ConversionOptions>;
  personalToken?: string; // Optional personal access token
}

/**
 * POST /api/figma/import
 * Import a Figma frame/node as HTML
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ImportRequest = await request.json();
    const { figmaUrl, options = {}, personalToken } = body;

    if (!figmaUrl) {
      return NextResponse.json({ error: "Figma URL is required" }, { status: 400 });
    }

    // Parse Figma URL
    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid Figma URL. Please provide a valid Figma file or frame link." },
        { status: 400 }
      );
    }

    const { fileKey, nodeId } = parsed;

    // Get access token - either personal token or OAuth token
    let accessToken = personalToken;

    if (!accessToken) {
      // Get user's OAuth tokens from database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          figmaAccessToken: true,
          figmaRefreshToken: true,
          figmaTokenExpiry: true,
        },
      });

      if (!user?.figmaAccessToken) {
        return NextResponse.json(
          { error: "Figma not connected. Please connect your Figma account or provide a personal access token." },
          { status: 401 }
        );
      }

      // Check if token is expired and refresh if needed
      if (user.figmaTokenExpiry && new Date(user.figmaTokenExpiry) < new Date()) {
        if (!user.figmaRefreshToken) {
          return NextResponse.json(
            { error: "Figma token expired. Please reconnect your Figma account." },
            { status: 401 }
          );
        }

        try {
          const newTokens = await refreshAccessToken(user.figmaRefreshToken);
          const tokenExpiry = new Date(Date.now() + newTokens.expiresIn * 1000);

          await prisma.user.update({
            where: { id: session.user.id },
            data: {
              figmaAccessToken: newTokens.accessToken,
              figmaTokenExpiry: tokenExpiry,
            },
          });

          accessToken = newTokens.accessToken;
        } catch (refreshError) {
          console.error("[Figma Import] Token refresh failed:", refreshError);
          return NextResponse.json(
            { error: "Failed to refresh Figma token. Please reconnect your Figma account." },
            { status: 401 }
          );
        }
      } else {
        accessToken = user.figmaAccessToken;
      }
    }

    // Create Figma client and fetch the file/node
    const client = new FigmaClient(accessToken);

    let targetNode;
    let fileName;

    if (nodeId) {
      // Fetch specific node
      const nodesResponse = await client.getFileNodes(fileKey, [nodeId]);
      const nodeData = nodesResponse.nodes[nodeId];

      if (!nodeData) {
        return NextResponse.json(
          { error: "Node not found in Figma file" },
          { status: 404 }
        );
      }

      targetNode = nodeData.document;
      fileName = nodesResponse.name;
    } else {
      // Fetch entire file (first page, first frame)
      const fileResponse = await client.getFile(fileKey, 2);
      fileName = fileResponse.name;

      // Get the first page
      const firstPage = fileResponse.document.children?.[0];
      if (!firstPage) {
        return NextResponse.json(
          { error: "No pages found in Figma file" },
          { status: 404 }
        );
      }

      // Get the first frame on the page
      const firstFrame = firstPage.children?.find(
        (child) => child.type === "FRAME" || child.type === "COMPONENT"
      );

      if (!firstFrame) {
        return NextResponse.json(
          { error: "No frames found on the first page. Please select a specific frame." },
          { status: 404 }
        );
      }

      targetNode = firstFrame;
    }

    // Convert Figma node to HTML
    const result = figmaToHtml(targetNode, options);

    // Fetch images if any
    if (result.images.length > 0) {
      try {
        const imageNodeIds = result.images.map((img) => img.nodeId);
        const imagesResponse = await client.getImages(fileKey, imageNodeIds, "png", 2);

        // Replace image placeholders with actual URLs
        // (In production, you'd want to download and re-upload these to your own CDN)
        result.html = result.images.reduce((html, img) => {
          const imageUrl = imagesResponse.images[img.nodeId];
          if (imageUrl) {
            // Add background-image to CSS
            result.css += `\n.${img.nodeId.replace(":", "-")} { background-image: url('${imageUrl}'); }`;
          }
          return html;
        }, result.html);
      } catch (imageError) {
        console.error("[Figma Import] Failed to fetch images:", imageError);
        // Continue without images
      }
    }

    // Wrap HTML with style tag
    const fullHtml = `
<!-- Imported from Figma: ${fileName} -->
<style>
${result.css}
</style>
${result.html}
`.trim();

    return NextResponse.json({
      success: true,
      html: fullHtml,
      nodeName: targetNode.name,
      fileName,
      nodeId: targetNode.id,
    });
  } catch (error) {
    console.error("[Figma Import] Error:", error);

    // Handle specific Figma API errors
    if (error instanceof Error) {
      if (error.message.includes("403")) {
        return NextResponse.json(
          { error: "Access denied. Make sure you have access to this Figma file." },
          { status: 403 }
        );
      }
      if (error.message.includes("404")) {
        return NextResponse.json(
          { error: "Figma file not found. Check the URL and try again." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to import from Figma. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/figma/import/status
 * Check if user has Figma connected
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        figmaAccessToken: true,
        figmaTokenExpiry: true,
        figmaUserId: true,
      },
    });

    const connected = !!user?.figmaAccessToken;
    const expired = user?.figmaTokenExpiry
      ? new Date(user.figmaTokenExpiry) < new Date()
      : false;

    return NextResponse.json({
      connected,
      expired,
      figmaUserId: user?.figmaUserId,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
