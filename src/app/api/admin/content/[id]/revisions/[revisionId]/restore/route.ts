import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { restoreRevision } from "@/lib/flxbl/revisions";

// =============================================================================
// POST - Restore a Revision
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  try {
    const { id, revisionId } = await params;
    const client = getFlxblClient();

    // Get the current author for the content (to record who made the restore)
    const authorRels = await client.getRelationships(
      "Content",
      id,
      "AUTHORED_BY",
      "out",
      "Author"
    );
    const authorId = authorRels[0]?.target?.id;

    if (!authorId) {
      return NextResponse.json(
        { message: "No author found for content - cannot restore" },
        { status: 400 }
      );
    }

    // Restore the revision
    const newRevision = await restoreRevision(client, id, revisionId, authorId);

    return NextResponse.json(newRevision);
  } catch (error) {
    console.error("Failed to restore revision:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to restore revision" },
      { status: 500 }
    );
  }
}

