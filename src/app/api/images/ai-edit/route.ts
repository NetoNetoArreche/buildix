import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// Initialize S3 client
const getS3Client = () => {
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION
  ) {
    return null;
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

// Upload base64 image to S3
async function uploadToS3(base64Data: string, mimeType: string, prompt: string, userId: string): Promise<string | null> {
  const s3 = getS3Client();
  if (!s3 || !process.env.AWS_S3_BUCKET) {
    console.log("[AI Edit] S3 not configured, skipping upload");
    return null;
  }

  try {
    const buffer = Buffer.from(base64Data, "base64");
    const extension = mimeType.split("/")[1] || "png";
    const key = `ai-edited/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3.send(command);

    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    try {
      await prisma.userImage.create({
        data: {
          userId,
          key,
          url: publicUrl,
          filename: `ai-edited-${prompt.substring(0, 30)}`,
          mimeType,
          size: buffer.length,
        },
      });
    } catch (dbError) {
      console.log("[AI Edit] Database save failed:", dbError);
    }

    return publicUrl;
  } catch (error) {
    console.error("[AI Edit] S3 upload failed:", error);
    return null;
  }
}

// Convert image URL to base64
async function imageUrlToBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    // If it's already a base64 data URL
    if (imageUrl.startsWith("data:")) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return { data: matches[2], mimeType: matches[1] };
      }
      return null;
    }

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = response.headers.get("content-type") || "image/png";

    return { data: base64, mimeType };
  } catch (error) {
    console.error("[AI Edit] Failed to convert image to base64:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", image: null },
        { status: 401 }
      );
    }

    const { imageUrl, editPrompt } = await req.json();

    if (!imageUrl || !editPrompt) {
      return NextResponse.json(
        { error: "Image URL and edit prompt are required", image: null },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured", image: null },
        { status: 503 }
      );
    }

    // Convert image to base64
    const imageData = await imageUrlToBase64(imageUrl);
    if (!imageData) {
      return NextResponse.json(
        { error: "Failed to process the image", image: null },
        { status: 400 }
      );
    }

    // Use Gemini 3 Pro Image Preview for image editing
    const model = "gemini-3-pro-image-preview";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log("[AI Edit] Using model:", model);
    console.log("[AI Edit] Edit prompt:", editPrompt);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.data,
                },
              },
              {
                text: editPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[AI Edit] API error:", response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("[AI Edit] Response received");

    // Extract the edited image from the response
    let editedImage = null;

    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              const mimeType = part.inlineData.mimeType || "image/png";
              const base64Data = part.inlineData.data;
              const base64Url = `data:${mimeType};base64,${base64Data}`;

              // Try to upload to S3 for persistence
              const s3Url = await uploadToS3(base64Data, mimeType, editPrompt, user.id);

              editedImage = {
                id: `ai-edit-${Date.now()}`,
                url: s3Url || base64Url,
                thumb: s3Url || base64Url,
                alt: editPrompt,
                source: "ai-edited",
              };

              if (s3Url) {
                console.log("[AI Edit] Image saved to S3:", s3Url);
              }
              break;
            }
          }
        }
        if (editedImage) break;
      }
    }

    if (!editedImage) {
      console.log("[AI Edit] No edited image in response");
      return NextResponse.json({
        error: "Failed to edit the image. Please try a different edit prompt.",
        image: null,
      });
    }

    return NextResponse.json({ image: editedImage });
  } catch (error) {
    console.error("[AI Edit] Failed:", error);
    return NextResponse.json(
      { error: "Failed to edit image. Please try again.", image: null },
      { status: 500 }
    );
  }
}
