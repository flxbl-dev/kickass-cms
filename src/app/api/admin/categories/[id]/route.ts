import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getCategoryParent, getCategoryChildren, setCategoryParent } from "@/lib/flxbl/queries";
import { ensureMutable, SystemContentError, createSystemContentResponse } from "@/lib/flxbl/guards";

// =============================================================================
// GET - Get Single Category (with parent info via relationship)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();
    const category = await client.get("Category", id);
    const parent = await getCategoryParent(client, id);

    return NextResponse.json({
      ...category,
      parentId: parent?.id ?? null,
    });
  } catch (error) {
    console.error("Failed to get category:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get category" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Category
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Check if category is system/demo content
    await ensureMutable(client, "Category", id);

    // Build update data - only include provided fields (excluding parentId)
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;

    // Update category entity
    const category = await client.patch("Category", id, updateData);

    // Handle parentId change via relationship
    if (body.parentId !== undefined) {
      await setCategoryParent(client, id, body.parentId);
    }

    // Get current parent for response
    const parent = await getCategoryParent(client, id);

    return NextResponse.json({
      ...category,
      parentId: parent?.id ?? null,
    });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Category"), { status: 403 });
    }
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update category" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Category
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    // Check if category is system/demo content
    await ensureMutable(client, "Category", id);

    // Check for children via CATEGORY_PARENT relationship
    const children = await getCategoryChildren(client, id);

    if (children.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete category with children. Delete or reassign children first." },
        { status: 400 }
      );
    }

    // Delete parent relationship if exists
    const parent = await getCategoryParent(client, id);
    if (parent) {
      await client.deleteRelationship(
        "Category",
        id,
        "CATEGORY_PARENT",
        parent.id
      );
    }

    // Delete any relationships with content
    const contentRels = await client.getRelationships(
      "Category",
      id,
      "CATEGORIZED_AS",
      "in",
      "Content"
    );

    for (const rel of contentRels) {
      await client.deleteRelationship(
        "Content",
        rel.target.id,
        "CATEGORIZED_AS",
        id
      );
    }

    // Delete the category
    await client.delete("Category", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Category"), { status: 403 });
    }
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 500 }
    );
  }
}

