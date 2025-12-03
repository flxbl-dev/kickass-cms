/**
 * Preview Mode Helpers
 *
 * Utilities for handling Next.js draft mode and content preview
 */

import { draftMode, cookies } from "next/headers";
import type { FlxblClient } from "./client";
import type { Content, Page } from "./types";

// =============================================================================
// Draft Mode Helpers
// =============================================================================

/**
 * Check if Next.js draft mode is currently enabled
 */
export async function isPreviewMode(): Promise<boolean> {
  const draft = await draftMode();
  return draft.isEnabled;
}

/**
 * Get preview token from cookies (for API validation)
 */
export async function getPreviewToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("__prerender_bypass")?.value;
}

// =============================================================================
// Preview Content Fetching
// =============================================================================

/**
 * Get content by slug, bypassing workflow state filter when in preview mode
 */
export async function getContentForPreview(
  client: FlxblClient,
  slug: string,
  preview = false
): Promise<Content | null> {
  // Get content by slug regardless of state
  const results = await client.query("Content", {
    where: { slug: { $eq: slug } },
    limit: 1,
  });

  const content = results[0];
  if (!content) return null;

  // If not in preview mode, check if content is published
  if (!preview) {
    const stateRels = await client.getRelationships(
      "Content",
      content.id,
      "HAS_STATE",
      "out",
      "WorkflowState"
    );

    const currentState = stateRels[0]?.target;
    if (!currentState || currentState.slug !== "published") {
      return null;
    }
  }

  return content;
}

/**
 * Get page by path, bypassing isPublished filter when in preview mode
 */
export async function getPageForPreview(
  client: FlxblClient,
  path: string,
  preview = false
): Promise<Page | null> {
  const results = await client.query("Page", {
    where: { path: { $eq: path } },
    limit: 1,
  });

  const page = results[0];
  if (!page) return null;

  // If not in preview mode, check if page is published
  if (!preview && !page.isPublished) {
    return null;
  }

  return page;
}

/**
 * Get all content regardless of workflow state (for preview listing)
 */
export async function getAllContentForPreview(
  client: FlxblClient,
  options?: {
    limit?: number;
    offset?: number;
    contentType?: "PAGE" | "POST" | "ARTICLE";
  }
): Promise<Content[]> {
  const where: Record<string, unknown> = {};

  if (options?.contentType) {
    where.contentType = { $eq: options.contentType };
  }

  const results = await client.query("Content", {
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: "updatedAt",
    orderDirection: "DESC",
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  });

  return results;
}

// =============================================================================
// Preview URL Generation
// =============================================================================

/**
 * Generate a preview URL for content
 */
export function getPreviewUrl(
  contentType: "page" | "content",
  slug: string,
  baseUrl = ""
): string {
  const secret = process.env.PREVIEW_SECRET || "preview-secret";
  
  if (contentType === "page") {
    return `${baseUrl}/api/preview?secret=${secret}&type=page&slug=${encodeURIComponent(slug)}`;
  }
  
  return `${baseUrl}/api/preview?secret=${secret}&type=content&slug=${encodeURIComponent(slug)}`;
}

/**
 * Generate exit preview URL
 */
export function getExitPreviewUrl(redirectTo = "/"): string {
  return `/api/preview/disable?redirect=${encodeURIComponent(redirectTo)}`;
}

// =============================================================================
// Preview Validation
// =============================================================================

/**
 * Validate preview secret token
 */
export function isValidPreviewSecret(secret: string | null | undefined): boolean {
  const expectedSecret = process.env.PREVIEW_SECRET || "preview-secret";
  return secret === expectedSecret;
}

