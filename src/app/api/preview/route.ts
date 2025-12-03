import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { isValidPreviewSecret } from "@/lib/flxbl/preview";

/**
 * Enable Next.js Draft Mode for content preview
 *
 * Usage: GET /api/preview?secret=<secret>&type=<page|content>&slug=<slug>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get("secret");
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  // Validate secret
  if (!isValidPreviewSecret(secret)) {
    return new Response("Invalid preview secret", { status: 401 });
  }

  // Validate required parameters
  if (!type || !slug) {
    return new Response("Missing type or slug parameter", { status: 400 });
  }

  // Enable draft mode
  const draft = await draftMode();
  draft.enable();

  // Redirect to the appropriate page
  if (type === "page") {
    // Page preview - redirect to the page path
    redirect(slug.startsWith("/") ? slug : `/${slug}`);
  } else if (type === "content") {
    // Content preview - redirect to blog post
    redirect(`/blog/${slug}`);
  } else {
    return new Response("Invalid type parameter", { status: 400 });
  }
}

