import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * Disable Next.js Draft Mode
 *
 * Usage: GET /api/preview/disable?redirect=<url>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectTo = searchParams.get("redirect") || "/";

  // Disable draft mode
  const draft = await draftMode();
  draft.disable();

  // Redirect to the specified URL
  redirect(redirectTo);
}

