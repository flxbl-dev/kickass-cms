import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { ensureMutable, SystemContentError, createSystemContentResponse } from "@/lib/flxbl/guards";

// =============================================================================
// GET - Get Single Author
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();
    const author = await client.get("Author", id);

    return NextResponse.json(author);
  } catch (error) {
    console.error("Failed to get author:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get author" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Author
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Check if author is system/demo content
    await ensureMutable(client, "Author", id);

    // Build update data - only include provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    const author = await client.patch("Author", id, updateData);

    return NextResponse.json(author);
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Author"), { status: 403 });
    }
    console.error("Failed to update author:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update author" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Author
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    // Check if author is system/demo content
    await ensureMutable(client, "Author", id);

    // Check if author has content
    const contentRels = await client.getRelationships(
      "Author",
      id,
      "AUTHORED_BY",
      "in",
      "Content"
    );

    if (contentRels.length > 0) {
      return NextResponse.json(
        { 
          message: `This author has ${contentRels.length} content item(s). Reassign or delete the content first.` 
        },
        { status: 400 }
      );
    }

    // Delete the author
    await client.delete("Author", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Author"), { status: 403 });
    }
    console.error("Failed to delete author:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete author" },
      { status: 500 }
    );
  }
}

