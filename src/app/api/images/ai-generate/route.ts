import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { canUseFeature, incrementUsage, getUsageLimitMessage } from "@/lib/usage";

// Admin bypass - same email used in ai/stream
const ADMIN_EMAIL = "helioarreche@gmail.com";

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
    console.log("[AI Generate] S3 not configured, skipping upload");
    return null;
  }

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");
    const extension = mimeType.split("/")[1] || "png";
    const key = `ai-generated/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3.send(command);

    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Save to database
    try {
      await prisma.userImage.create({
        data: {
          userId,
          key,
          url: publicUrl,
          filename: `ai-generated-${prompt.substring(0, 30)}`,
          mimeType,
          size: buffer.length,
        },
      });
    } catch (dbError) {
      console.log("[AI Generate] Database save failed:", dbError);
    }

    return publicUrl;
  } catch (error) {
    console.error("[AI Generate] S3 upload failed:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", images: [] },
        { status: 401 }
      );
    }

    const { prompt, style, aspectRatio } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required", images: [] },
        { status: 400 }
      );
    }

    // Admin bypass - no usage limits for admin
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Check usage limits for images (skip for admin)
    if (!isAdmin) {
      const { allowed, usage, plan } = await canUseFeature(user.id, "images");
      if (!allowed) {
        const message = getUsageLimitMessage("images", plan);
        return NextResponse.json(
          { error: message, usageLimit: true, usage, plan, images: [] },
          { status: 429 }
        );
      }
    }

    // Use GEMINI_API_KEY for image generation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured", images: [] },
        { status: 503 }
      );
    }

    // Validate and normalize aspect ratio - Gemini supports many ratios
    const validAspectRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
    const normalizedAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    // Construct the full prompt with style
    let fullPrompt = prompt;
    if (style) {
      fullPrompt = `${style} style: ${prompt}`;
    }

    // Use Gemini 3 Pro Image Preview for image generation with native aspectRatio support
    const model = "gemini-3-pro-image-preview";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log("[AI Generate] Using model:", model);
    console.log("[AI Generate] Prompt:", fullPrompt);
    console.log("[AI Generate] Aspect Ratio:", normalizedAspectRatio);

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
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: normalizedAspectRatio
          }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[AI Generate] API error:", response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("[AI Generate] Response received");

    // Extract images from the Gemini response
    const images: any[] = [];

    // Gemini returns candidates array with content.parts containing inlineData
    if (data.candidates && Array.isArray(data.candidates)) {
      for (const candidate of data.candidates) {
        if (candidate.content?.parts) {
          for (let index = 0; index < candidate.content.parts.length; index++) {
            const part = candidate.content.parts[index];
            if (part.inlineData?.data) {
              const mimeType = part.inlineData.mimeType || "image/png";
              const base64Data = part.inlineData.data;
              const base64Url = `data:${mimeType};base64,${base64Data}`;

              // Try to upload to S3 for persistence
              const s3Url = await uploadToS3(base64Data, mimeType, prompt, user.id);

              images.push({
                id: `ai-${Date.now()}-${index}`,
                url: s3Url || base64Url,
                thumb: s3Url || base64Url,
                alt: prompt,
                source: "ai-generated",
              });

              if (s3Url) {
                console.log("[AI Generate] Image saved to S3:", s3Url);
              }
            }
          }
        }
      }
    }

    if (images.length === 0) {
      console.log("[AI Generate] No images in response");
      return NextResponse.json({
        error: "No images were generated. The prompt may have been rejected by safety filters.",
        images: [],
      });
    }

    // Increment usage for successful image generation (skip for admin)
    if (!isAdmin) {
      await incrementUsage(user.id, "images", images.length);
      console.log(`[AI Generate] Usage incremented: ${images.length} images for user ${user.id}`);
    } else {
      console.log(`[AI Generate] Admin bypass: ${images.length} images generated without usage increment`);
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("[AI Generate] Failed:", error);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again.", images: [] },
      { status: 500 }
    );
  }
}
