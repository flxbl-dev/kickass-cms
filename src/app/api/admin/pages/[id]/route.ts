import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import {
  getPageParent,
  getPageChildren,
  setPageParent,
  setPageLayout,
  setPageFilterCategories,
  getPageLayout,
  getPageFilterCategories,
} from "@/lib/flxbl/pages";
import { ensureMutable, SystemContentError, createSystemContentResponse } from "@/lib/flxbl/guards";

// =============================================================================
// GET - Get Single Page (with relations)
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    const page = await client.get("Page", id);
    const parent = await getPageParent(client, id);
    const layout = await getPageLayout(client, id);
    const filterCategories = await getPageFilterCategories(client, id);

    return NextResponse.json({
      ...page,
      parentId: parent?.id ?? null,
      layoutId: layout?.id ?? null,
      categoryIds: filterCategories.map((c) => c.id),
    });
  } catch (error) {
    console.error("Failed to get page:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get page" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH - Update Page
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getFlxblClient();

    // Check if page is system/demo content
    await ensureMutable(client, "Page", id);

    // Build update data - only include provided fields
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.path !== undefined) updateData.path = body.path;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.showInNav !== undefined) updateData.showInNav = body.showInNav;
    if (body.navOrder !== undefined) updateData.navOrder = body.navOrder;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    // Update page entity
    const page = await client.patch("Page", id, updateData);

    // Handle parentId change via relationship
    if (body.parentId !== undefined) {
      await setPageParent(client, id, body.parentId);
    }

    // Handle layout change via relationship
    if (body.layoutId !== undefined) {
      if (body.layoutId) {
        await setPageLayout(client, id, body.layoutId);
      } else {
        // Remove layout relationship
        const existingLayout = await getPageLayout(client, id);
        if (existingLayout) {
          await client.deleteRelationship("Page", id, "PAGE_USES_LAYOUT", existingLayout.id);
        }
      }
    }

    // Handle category filter changes
    if (body.categoryIds !== undefined) {
      await setPageFilterCategories(client, id, body.categoryIds || []);
    }

    // Get current relations for response
    const parent = await getPageParent(client, id);
    const layout = await getPageLayout(client, id);
    const filterCategories = await getPageFilterCategories(client, id);

    return NextResponse.json({
      ...page,
      parentId: parent?.id ?? null,
      layoutId: layout?.id ?? null,
      categoryIds: filterCategories.map((c) => c.id),
    });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Page"), { status: 403 });
    }
    console.error("Failed to update page:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update page" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Page
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getFlxblClient();

    // Check if page is system/demo content
    await ensureMutable(client, "Page", id);

    // Check for children via PAGE_PARENT relationship
    const children = await getPageChildren(client, id);

    if (children.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete page with children. Delete or reassign children first." },
        { status: 400 }
      );
    }

    // Delete parent relationship if exists
    const parent = await getPageParent(client, id);
    if (parent) {
      await client.deleteRelationship("Page", id, "PAGE_PARENT", parent.id);
    }

    // Delete layout relationship if exists
    const layout = await getPageLayout(client, id);
    if (layout) {
      await client.deleteRelationship("Page", id, "PAGE_USES_LAYOUT", layout.id);
    }

    // Delete category filter relationships
    const categories = await getPageFilterCategories(client, id);
    for (const category of categories) {
      await client.deleteRelationship("Page", id, "PAGE_FILTERS_CATEGORY", category.id);
    }

    // Delete page sections
    const sectionRels = await client.getRelationships(
      "Page",
      id,
      "PAGE_HAS_SECTION",
      "out",
      "PageSection"
    );
    for (const rel of sectionRels) {
      // Delete section content relationships first
      const contentRels = await client.getRelationships(
        "PageSection",
        rel.target.id,
        "SECTION_HAS_CONTENT",
        "out",
        "Content"
      );
      for (const contentRel of contentRels) {
        await client.deleteRelationship(
          "PageSection",
          rel.target.id,
          "SECTION_HAS_CONTENT",
          contentRel.target.id
        );
      }

      // Delete the section relationship
      await client.deleteRelationship("Page", id, "PAGE_HAS_SECTION", rel.target.id);

      // Delete the section entity
      await client.delete("PageSection", rel.target.id);
    }

    // Delete the page
    await client.delete("Page", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SystemContentError) {
      return NextResponse.json(createSystemContentResponse("Page"), { status: 403 });
    }
    console.error("Failed to delete page:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete page" },
      { status: 500 }
    );
  }
}

