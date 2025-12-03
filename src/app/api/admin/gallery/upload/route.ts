import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";

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

// POST - Upload image(s) to S3 and save to gallery
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const s3 = getS3Client();
  if (!s3) {
    return NextResponse.json(
      { error: "S3 not configured. Please add AWS credentials to environment variables." },
      { status: 503 }
    );
  }

  if (!process.env.AWS_S3_BUCKET) {
    return NextResponse.json(
      { error: "S3 bucket not configured" },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const category = (formData.get("category") as string) || "abstract";
    const tags = (formData.get("tags") as string) || "";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedImages = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          errors.push({ file: file.name, error: "Not an image file" });
          continue;
        }

        // Get file buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Generate unique key
        const fileExtension = file.name.split(".").pop() || "jpg";
        const key = `gallery/${uuidv4()}.${fileExtension}`;

        // Upload to S3
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        });

        await s3.send(command);

        const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Detect aspect ratio from filename or default to landscape
        let aspectRatio = "landscape";
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes("portrait") || lowerName.includes("vertical")) {
          aspectRatio = "portrait";
        } else if (lowerName.includes("square")) {
          aspectRatio = "square";
        }

        // Save to database
        const image = await prisma.buildixGalleryImage.create({
          data: {
            url: publicUrl,
            thumb: publicUrl, // Could generate thumbnail later
            alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            category,
            aspectRatio,
            tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            isActive: true,
          },
        });

        uploadedImages.push(image);
      } catch (fileError) {
        console.error(`Failed to upload ${file.name}:`, fileError);
        errors.push({ file: file.name, error: "Upload failed" });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedImages.length,
      failed: errors.length,
      images: uploadedImages,
      errors,
    });
  } catch (error) {
    console.error("Failed to process upload:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
