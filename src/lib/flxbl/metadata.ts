/**
 * SEO Metadata Helpers
 *
 * Utilities for extracting and generating SEO metadata from FLXBL entities
 */

import type { Metadata } from "next";
import type { FlxblClient } from "./client";
import type { Page, Content, Media } from "./types";

// =============================================================================
// Types
// =============================================================================

interface MetadataJson {
  "og:title"?: string;
  "og:description"?: string;
  "og:image"?: string;
  "og:type"?: string;
  "twitter:card"?: string;
  "twitter:title"?: string;
  "twitter:description"?: string;
  "twitter:image"?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  [key: string]: unknown;
}

// =============================================================================
// Page Metadata Extraction
// =============================================================================

/**
 * Extract metadata from a Page entity's metadata JSON field
 */
export function extractPageMetadata(page: Page): MetadataJson {
  if (!page.metadata) return {};
  return page.metadata as MetadataJson;
}

/**
 * Extract metadata from a Content entity's metadata JSON field
 */
export function extractContentMetadata(content: Content): MetadataJson {
  if (!content.metadata) return {};
  return content.metadata as MetadataJson;
}

// =============================================================================
// Featured Image Helpers
// =============================================================================

/**
 * Get featured image URL for content by traversing HAS_MEDIA relationship
 */
export async function getFeaturedImageUrl(
  client: FlxblClient,
  contentId: string
): Promise<string | null> {
  const mediaRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_MEDIA",
    "out",
    "Media"
  );

  const featuredMedia = mediaRels.find(
    (r) => (r.relationship.properties as { role?: string }).role === "FEATURED"
  );

  return (featuredMedia?.target as Media)?.url ?? null;
}

// =============================================================================
// Next.js Metadata Generators
// =============================================================================

interface GeneratePageMetadataOptions {
  page: Page;
  baseUrl?: string;
  siteName?: string;
}

/**
 * Generate Next.js Metadata object from a Page entity
 */
export function generatePageMetadata({
  page,
  baseUrl = "",
  siteName = "Kickass CMS",
}: GeneratePageMetadataOptions): Metadata {
  const meta = extractPageMetadata(page);

  const title = meta["og:title"] || page.title;
  const description = meta["og:description"] || page.description || undefined;
  const ogImage = meta["og:image"];

  const metadata: Metadata = {
    title: `${title} | ${siteName}`,
    description,
  };

  // Open Graph
  metadata.openGraph = {
    title: meta["og:title"] || page.title,
    description: meta["og:description"] || page.description || undefined,
    type: (meta["og:type"] as "website" | "article") || "website",
    url: `${baseUrl}${page.path}`,
    siteName,
  };

  if (ogImage && metadata.openGraph) {
    metadata.openGraph.images = [{ url: ogImage }];
  }

  // Twitter Card
  metadata.twitter = {
    card: (meta["twitter:card"] as "summary" | "summary_large_image") || "summary_large_image",
    title: meta["twitter:title"] || meta["og:title"] || page.title,
    description: meta["twitter:description"] || meta["og:description"] || page.description || undefined,
  };

  if ((meta["twitter:image"] || ogImage) && metadata.twitter) {
    metadata.twitter.images = [meta["twitter:image"] || ogImage!];
  }

  // Keywords
  if (meta.keywords && Array.isArray(meta.keywords)) {
    metadata.keywords = meta.keywords;
  }

  // Canonical URL
  if (meta.canonical) {
    metadata.alternates = {
      canonical: meta.canonical,
    };
  }

  // Robots
  if (meta.robots) {
    metadata.robots = meta.robots;
  }

  return metadata;
}

interface GenerateContentMetadataOptions {
  content: Content;
  featuredImageUrl?: string | null;
  baseUrl?: string;
  siteName?: string;
  basePath?: string;
}

/**
 * Generate Next.js Metadata object from a Content entity
 */
export function generateContentMetadata({
  content,
  featuredImageUrl,
  baseUrl = "",
  siteName = "Kickass CMS",
  basePath = "/blog",
}: GenerateContentMetadataOptions): Metadata {
  const meta = extractContentMetadata(content);

  const title = meta["og:title"] || content.title;
  const description = meta["og:description"] || content.excerpt || undefined;
  const ogImage = meta["og:image"] || featuredImageUrl;

  const metadata: Metadata = {
    title: `${title} | ${siteName}`,
    description,
  };

  // Open Graph
  metadata.openGraph = {
    title: meta["og:title"] || content.title,
    description: meta["og:description"] || content.excerpt || undefined,
    type: "article",
    url: `${baseUrl}${basePath}/${content.slug}`,
    siteName,
    publishedTime: content.publishedAt?.toISOString(),
  };

  if (ogImage && metadata.openGraph) {
    metadata.openGraph.images = [{ url: ogImage }];
  }

  // Twitter Card
  metadata.twitter = {
    card: (meta["twitter:card"] as "summary" | "summary_large_image") || "summary_large_image",
    title: meta["twitter:title"] || meta["og:title"] || content.title,
    description: meta["twitter:description"] || meta["og:description"] || content.excerpt || undefined,
  };

  if ((meta["twitter:image"] || ogImage) && metadata.twitter) {
    metadata.twitter.images = [meta["twitter:image"] || ogImage!];
  }

  // Keywords from tags
  const keywords = meta.keywords || content.tags;
  if (keywords && Array.isArray(keywords)) {
    metadata.keywords = keywords;
  }

  // Canonical URL
  if (meta.canonical) {
    metadata.alternates = {
      canonical: meta.canonical,
    };
  }

  return metadata;
}

// =============================================================================
// Default Metadata
// =============================================================================

/**
 * Get default site metadata
 */
export function getDefaultMetadata(siteName = "Kickass CMS"): Metadata {
  return {
    title: siteName,
    description: "A modern content management system powered by FLXBL",
    openGraph: {
      title: siteName,
      description: "A modern content management system powered by FLXBL",
      type: "website",
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: "A modern content management system powered by FLXBL",
    },
  };
}

