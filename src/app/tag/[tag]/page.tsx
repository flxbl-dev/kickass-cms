import type { Metadata } from "next";
import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";

// Revalidate every 60 seconds for ISR
export const revalidate = 60;
import { searchContentByTag } from "@/lib/flxbl/queries";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { ContentGrid, type ContentCardData } from "@/components/content/content-card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Hash } from "lucide-react";

// =============================================================================
// Data Fetching
// =============================================================================

async function getPublishedContentByTag(tag: string): Promise<ContentCardData[]> {
  const client = getFlxblClient();

  try {
    // Get content with this tag
    const contentItems = await searchContentByTag(client, tag);

    // Filter to published content and enrich with relations
    const publishedContent: ContentCardData[] = [];

    for (const content of contentItems) {
      // Check if published
      const stateRels = await client.getRelationships(
        "Content",
        content.id,
        "HAS_STATE",
        "out",
        "WorkflowState"
      );

      const currentState = stateRels[0]?.target;
      if (!currentState || currentState.slug !== "published") {
        continue;
      }

      // Get author
      const authorRels = await client.getRelationships(
        "Content",
        content.id,
        "AUTHORED_BY",
        "out",
        "Author"
      );
      const primaryAuthor = authorRels.find(
        (r) => r.relationship.properties.role === "PRIMARY"
      )?.target;

      // Get featured image
      const mediaRels = await client.getRelationships(
        "Content",
        content.id,
        "HAS_MEDIA",
        "out",
        "Media"
      );
      const featuredImage = mediaRels.find(
        (r) => r.relationship.properties.role === "FEATURED"
      )?.target;

      // Get categories
      const catRels = await client.getRelationships(
        "Content",
        content.id,
        "CATEGORIZED_AS",
        "out",
        "Category"
      );
      const categories = catRels.map((r) => r.target);

      publishedContent.push({
        ...content,
        author: primaryAuthor ?? null,
        featuredImage: featuredImage ?? null,
        categories,
      });
    }

    // Sort by published date, newest first
    return publishedContent.sort((a, b) => {
      const dateA = a.publishedAt?.getTime() ?? 0;
      const dateB = b.publishedAt?.getTime() ?? 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Failed to fetch content by tag:", error);
    return [];
  }
}

// =============================================================================
// Metadata
// =============================================================================

interface PageParams {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `#${decodedTag} | Kickass CMS`,
    description: `Browse all content tagged with #${decodedTag}`,
  };
}

// =============================================================================
// Page Component
// =============================================================================

export default async function TagArchivePage({ params }: PageParams) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const content = await getPublishedContentByTag(decodedTag);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader showAdminLink />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>#{decodedTag}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>

          {/* Tag Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="size-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                {decodedTag}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {content.length} {content.length === 1 ? "article" : "articles"} tagged with{" "}
              <Badge variant="outline">#{decodedTag}</Badge>
            </p>
          </header>

          {/* Content Grid */}
          <ContentGrid
            content={content}
            emptyMessage={`No published content tagged with #${decodedTag} yet.`}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// =============================================================================
// Static Generation
// =============================================================================

export async function generateStaticParams() {
  const client = getFlxblClient();

  try {
    // Get all content and collect unique tags
    const allContent = await client.list("Content");
    const tagSet = new Set<string>();

    for (const content of allContent) {
      if (content.tags) {
        for (const tag of content.tags) {
          tagSet.add(tag);
        }
      }
    }

    return Array.from(tagSet).map((tag) => ({
      tag: encodeURIComponent(tag),
    }));
  } catch {
    return [];
  }
}

