import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

// =============================================================================
// On-Demand Revalidation API
// =============================================================================

/**
 * POST /api/revalidate
 *
 * Trigger on-demand revalidation for specific paths or tags.
 * Requires a secret token for authentication.
 *
 * Body:
 * - path: string (optional) - Specific path to revalidate (e.g., "/blog/my-post")
 * - tag: string (optional) - Cache tag to revalidate (e.g., "content")
 * - type: "path" | "tag" (default: "path")
 *
 * Headers:
 * - x-revalidate-token: Secret token for authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Validate secret token
    const token = request.headers.get("x-revalidate-token");
    const expectedToken = process.env.REVALIDATE_SECRET || process.env.PREVIEW_SECRET;

    if (!expectedToken) {
      return NextResponse.json(
        { error: "Revalidation secret not configured" },
        { status: 500 }
      );
    }

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid revalidation token" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { path, tag, type = "path" } = body as {
      path?: string;
      tag?: string;
      type?: "path" | "tag";
    };

    // Validate request
    if (type === "path" && !path) {
      return NextResponse.json(
        { error: "Path is required when type is 'path'" },
        { status: 400 }
      );
    }

    if (type === "tag" && !tag) {
      return NextResponse.json(
        { error: "Tag is required when type is 'tag'" },
        { status: 400 }
      );
    }

    // Perform revalidation
    if (type === "tag" && tag) {
      revalidateTag(tag, "max");
      return NextResponse.json({
        success: true,
        revalidated: { type: "tag", tag },
        timestamp: new Date().toISOString(),
      });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        revalidated: { type: "path", path },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "No path or tag provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/revalidate
 *
 * Simple health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Revalidation API is available. Use POST to trigger revalidation.",
  });
}

