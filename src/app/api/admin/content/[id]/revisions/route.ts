import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getRevisions, getRevisionAuthor } from "@/lib/flxbl/revisions";

// =============================================================================
// GET - List Revisions for Content
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    // Get all revisions
    const revisions = await getRevisions(client, id);

    // Enrich with author information
    const revisionsWithAuthors = await Promise.all(
      revisions.map(async (revision) => {
        const author = await getRevisionAuthor(client, revision.id);
        return {
          ...revision,
          author,
        };
      })
    );

    return NextResponse.json(revisionsWithAuthors);
  } catch (error) {
    console.error("Failed to fetch revisions:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch revisions" },
      { status: 500 }
    );
  }
}

