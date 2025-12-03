import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { saveContentBlocks } from "@/lib/flxbl/blocks";
import { createRevision } from "@/lib/flxbl/revisions";
import { ensureMutable, SystemContentError, createSystemContentResponse } from "@/lib/flxbl/guards";

// =============================================================================
// PATCH - Update Content
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Check if content is system/demo content
    await ensureMutable(client, "Content", id);

    // Update content fields
    const content = await client.patch("Content", id, {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || null,
      contentType: body.contentType,
      tags: body.tags || [],
    });

    // Update author relationship (delete existing, create new)
    if (body.authorId !== undefined) {
      const existingAuthorRels = await client.getRelationships(
        "Content",
        id,
        "AUTHORED_BY",
        "out",
        "Author"
      );

      // Delete existing
      for (const rel of existingAuthorRels) {
        await client.deleteRelationship("Content", id, "AUTHORED_BY", rel.target.id);
      }

      // Create new
      if (body.authorId) {
        await client.createRelationship(
          "Content",
          id,
          "AUTHORED_BY",
          body.authorId,
          { role: "PRIMARY", byline: null }
        );
      }
    }

    // Update category relationships
    if (body.categoryIds !== undefined) {
      const existingCategoryRels = await client.getRelationships(
        "Content",
        id,
        "CATEGORIZED_AS",
        "out",
        "Category"
      );

      // Delete existing
      for (const rel of existingCategoryRels) {
        await client.deleteRelationship("Content", id, "CATEGORIZED_AS", rel.target.id);
      }

      // Create new
      for (let i = 0; i < (body.categoryIds?.length ?? 0); i++) {
        await client.createRelationship(
          "Content",
          id,
          "CATEGORIZED_AS",
          body.categoryIds[i],
          { featured: false, position: i }
        );
      }
    }

    // Update state relationship
    if (body.stateId !== undefined) {
      const existingStateRels = await client.getRelationships(
        "Content",
        id,
        "HAS_STATE",
        "out",
        "WorkflowState"
      );

      // Delete existing
      for (const rel of existingStateRels) {
        await client.deleteRelationship("Content", id, "HAS_STATE", rel.target.id);
      }

      // Create new
      if (body.stateId) {
        await client.createRelationship(
          "Content",
          id,
          "HAS_STATE",
          body.stateId,
          { assignedAt: new Date(), assignedBy: "admin" }
        );
      }
    }

    // Update layout relationship
    if (body.layoutId !== undefined) {
      const existingLayoutRels = await client.getRelationships(
        "Content",
        id,
        "USES_LAYOUT",
        "out",
        "Layout"
      );

      // Delete existing
      for (const rel of existingLayoutRels) {
        await client.deleteRelationship("Content", id, "USES_LAYOUT", rel.target.id);
      }

      // Create new
      if (body.layoutId) {
        await client.createRelationship(
          "Content",
          id,
          "USES_LAYOUT",
          body.layoutId,
          {}
        );
      }
    }

    // Save content blocks from Tiptap JSON
    if (body.editorContent) {
      await saveContentBlocks(client, id, body.editorContent);
    }

    // Create revision for this update
    // Try to get author ID from existing relationship if not provided
    let authorId = body.authorId;
    if (!authorId) {
      const authorRels = await client.getRelationships("Content", id, "AUTHORED_BY", "out", "Author");
      authorId = authorRels[0]?.target?.id;
    }
    if (authorId) {
      await createRevision(client, id, authorId, "Content updated");
    }

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Content"), { status: 403 });
    }
    console.error("Failed to update content:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update content" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Content
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    // Check if content is system/demo content
    await ensureMutable(client, "Content", id);

    await client.delete("Content", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Content"), { status: 403 });
    }
    console.error("Failed to delete content:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete content" },
      { status: 500 }
    );
  }
}

