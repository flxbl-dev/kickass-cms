import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getFlxblClient } from "@/lib/flxbl/config";
import type { CreateMedia } from "@/lib/flxbl/types";

// =============================================================================
// Configuration
// =============================================================================

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// =============================================================================
// GET - List Media
// =============================================================================

export async function GET() {
  try {
    const client = getFlxblClient();
    const media = await client.list("Media", {
      orderBy: "createdAt",
      orderDirection: "DESC",
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to list media" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Upload Media
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "text/plain",
      "text/markdown",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename and save file
    const filename = generateFilename(file.name);
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filepath, buffer);

    // Create media record in FLXBL
    const client = getFlxblClient();
    const mediaData: CreateMedia = {
      filename: file.name,
      url: `/uploads/${filename}`,
      mimeType: file.type,
      size: file.size,
      alt: null,
      caption: null,
    };

    const media = await client.create("Media", mediaData);

    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to upload media:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to upload media" },
      { status: 500 }
    );
  }
}

