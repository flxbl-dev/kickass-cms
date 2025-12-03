import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { setCategoryParent } from "@/lib/flxbl/queries";

// =============================================================================
// POST - Batch Reorder Categories
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getFlxblClient();

    // Expect body to be an array of { id, parentId }
    if (!Array.isArray(body.updates)) {
      return NextResponse.json(
        { message: "Expected 'updates' array in request body" },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    for (const update of body.updates) {
      if (!update.id) {
        continue;
      }
      
      // Update parent relationship if parentId is provided (can be null to move to root)
      if (update.parentId !== undefined) {
        await setCategoryParent(client, update.id, update.parentId);
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (error) {
    console.error("Failed to reorder categories:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to reorder categories" },
      { status: 500 }
    );
  }
}

