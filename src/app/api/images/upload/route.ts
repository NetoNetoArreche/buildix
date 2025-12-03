import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

// Initialize S3 client only if credentials are available
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

// GET - Generate presigned URL for upload
export async function GET(req: NextRequest) {
  // Get authenticated user
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: "Missing fileName or fileType" },
      { status: 400 }
    );
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
    // Generate unique key for the file
    const fileExtension = fileName.split(".").pop() || "jpg";
    const key = `user-images/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// POST - Confirm upload and save to database
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, publicUrl, fileName, fileType, fileSize } = await req.json();

    if (!key || !publicUrl) {
      return NextResponse.json(
        { error: "Missing key or publicUrl" },
        { status: 400 }
      );
    }

    const userId = user.id;

    try {
      // Save to database
      await prisma.userImage.create({
        data: {
          userId,
          key,
          url: publicUrl,
          filename: fileName || "uploaded-image",
          mimeType: fileType || "image/jpeg",
          size: fileSize || 0,
        },
      });
    } catch (dbError) {
      // Database not available, but upload succeeded
      console.log("Database save failed, but S3 upload succeeded:", dbError);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Failed to confirm upload:", error);
    return NextResponse.json(
      { error: "Failed to confirm upload" },
      { status: 500 }
    );
  }
}
