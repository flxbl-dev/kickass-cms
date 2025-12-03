import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getFlxblClient } from "@/lib/flxbl/config";
import { ensureMutable, SystemContentError, createSystemContentResponse } from "@/lib/flxbl/guards";

// =============================================================================
// GET - Get Single Media Item
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();
    const media = await client.get("Media", id);

    return NextResponse.json(media);
  } catch (error) {
    console.error("Failed to get media:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get media" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Media Metadata
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Check if media is system/demo content
    await ensureMutable(client, "Media", id);

    // Only allow updating certain fields
    const updateData: Record<string, unknown> = {};
    if (body.alt !== undefined) updateData.alt = body.alt;
    if (body.caption !== undefined) updateData.caption = body.caption;
    if (body.filename !== undefined) updateData.filename = body.filename;

    const media = await client.patch("Media", id, updateData);

    return NextResponse.json(media);
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Media"), { status: 403 });
    }
    console.error("Failed to update media:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update media" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Media
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    // Check if media is system/demo content
    await ensureMutable(client, "Media", id);

    // Get the media record first to get the file path
    const media = await client.get("Media", id);

    // Delete the file from disk if it exists in uploads folder
    if (media.url.startsWith("/uploads/")) {
      const filename = media.url.replace("/uploads/", "");
      const filepath = path.join(process.cwd(), "public", "uploads", filename);

      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    // Delete the media record from FLXBL
    await client.delete("Media", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Media"), { status: 403 });
    }
    console.error("Failed to delete media:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete media" },
      { status: 500 }
    );
  }
}

