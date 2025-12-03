import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getNavigationTree } from "@/lib/flxbl/pages";

// =============================================================================
// GET - Get Page Navigation Tree
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publishedOnly = searchParams.get("publishedOnly") !== "false";

    const client = getFlxblClient();
    const tree = await getNavigationTree(client, publishedOnly);

    return NextResponse.json(tree);
  } catch (error) {
    console.error("Failed to get page tree:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get page tree" },
      { status: 500 }
    );
  }
}

