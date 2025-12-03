import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getAllCategoriesWithParent, setCategoryParent } from "@/lib/flxbl/queries";
import type { CreateCategory } from "@/lib/flxbl/types";

// =============================================================================
// GET - List Categories (with parent info via relationship)
// =============================================================================

export async function GET() {
  try {
    const client = getFlxblClient();
    // Get categories with parentId derived from CATEGORY_PARENT relationship
    const categories = await getAllCategoriesWithParent(client);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to list categories:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to list categories" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Category
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getFlxblClient();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { message: "Name and slug are required" },
        { status: 400 }
      );
    }

    const categoryData: CreateCategory = {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
    };

    const category = await client.create("Category", categoryData);

    // Set parent relationship if parentId provided
    if (body.parentId) {
      await setCategoryParent(client, category.id, body.parentId);
    }

    // Return category with parentId for consistency
    return NextResponse.json({
      ...category,
      parentId: body.parentId || null,
    });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create category" },
      { status: 500 }
    );
  }
}

