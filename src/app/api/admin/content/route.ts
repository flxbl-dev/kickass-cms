import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { saveContentBlocks } from "@/lib/flxbl/blocks";
import { createRevision } from "@/lib/flxbl/revisions";
import type { CreateContent } from "@/lib/flxbl/types";

// =============================================================================
// POST - Create Content
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getFlxblClient();

    // Create content
    const contentData: CreateContent = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || null,
      contentType: body.contentType,
      tags: body.tags || [],
      publishedAt: body.stateId && body.stateId === "published" ? new Date() : null,
      metadata: {},
    };

    const content = await client.create("Content", contentData);

    // Create author relationship
    if (body.authorId) {
      await client.createRelationship(
        "Content",
        content.id,
        "AUTHORED_BY",
        body.authorId,
        { role: "PRIMARY", byline: null }
      );
    }

    // Create category relationships
    if (body.categoryIds?.length > 0) {
      for (let i = 0; i < body.categoryIds.length; i++) {
        await client.createRelationship(
          "Content",
          content.id,
          "CATEGORIZED_AS",
          body.categoryIds[i],
          { featured: false, position: i }
        );
      }
    }

    // Create state relationship
    if (body.stateId) {
      await client.createRelationship(
        "Content",
        content.id,
        "HAS_STATE",
        body.stateId,
        { assignedAt: new Date(), assignedBy: "admin" }
      );
    }

    // Create layout relationship
    if (body.layoutId) {
      await client.createRelationship(
        "Content",
        content.id,
        "USES_LAYOUT",
        body.layoutId,
        {}
      );
    }

    // Save content blocks from Tiptap JSON
    if (body.editorContent) {
      await saveContentBlocks(client, content.id, body.editorContent);
    }

    // Create initial revision
    if (body.authorId) {
      await createRevision(client, content.id, body.authorId, "Initial content");
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to create content:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create content" },
      { status: 500 }
    );
  }
}

