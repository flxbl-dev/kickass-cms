import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import {
  getAllPages,
  setPageParent,
  setPageLayout,
  setPageFilterCategories,
  getPageParent,
} from "@/lib/flxbl/pages";
import type { CreatePage } from "@/lib/flxbl/types";

// =============================================================================
// GET - List Pages (with pagination)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const client = getFlxblClient();
    const pages = await getAllPages(client, { limit, offset });

    // Add parentId from relationships for each page
    const pagesWithParent = await Promise.all(
      pages.map(async (page) => {
        const parent = await getPageParent(client, page.id);
        return {
          ...page,
          parentId: parent?.id ?? null,
        };
      })
    );

    return NextResponse.json(pagesWithParent);
  } catch (error) {
    console.error("Failed to list pages:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to list pages" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Page
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getFlxblClient();

    // Validate required fields
    if (!body.title || !body.slug || !body.path) {
      return NextResponse.json(
        { message: "Title, slug, and path are required" },
        { status: 400 }
      );
    }

    // Create page
    const pageData: CreatePage = {
      title: body.title,
      slug: body.slug,
      path: body.path,
      description: body.description || null,
      isPublished: body.isPublished ?? false,
      showInNav: body.showInNav ?? true,
      navOrder: body.navOrder ?? 0,
      metadata: body.metadata || null,
    };

    const page = await client.create("Page", pageData);

    // Set parent relationship if provided
    if (body.parentId) {
      await setPageParent(client, page.id, body.parentId);
    }

    // Set layout relationship if provided
    if (body.layoutId) {
      await setPageLayout(client, page.id, body.layoutId);
    }

    // Set category filter relationships if provided
    if (body.categoryIds?.length > 0) {
      await setPageFilterCategories(client, page.id, body.categoryIds);
    }

    return NextResponse.json({
      ...page,
      parentId: body.parentId || null,
    });
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create page" },
      { status: 500 }
    );
  }
}

