import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";
import type { CreateAuthor } from "@/lib/flxbl/types";

// =============================================================================
// GET - List Authors
// =============================================================================

export async function GET() {
  try {
    const client = getFlxblClient();
    const authors = await client.list("Author", {
      orderBy: "name",
      orderDirection: "ASC",
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error("Failed to list authors:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to list authors" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Author
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getFlxblClient();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    const authorData: CreateAuthor = {
      name: body.name,
      email: body.email,
      bio: body.bio || null,
      avatarUrl: body.avatarUrl || null,
    };

    const author = await client.create("Author", authorData);

    return NextResponse.json(author);
  } catch (error) {
    console.error("Failed to create author:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create author" },
      { status: 500 }
    );
  }
}

