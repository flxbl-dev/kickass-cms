import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { ContentGrid, type ContentCardData } from "@/components/content/content-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import type { Category, Content, Author, Media } from "@/lib/flxbl/types";

// =============================================================================
// Data Fetching
// =============================================================================

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const client = getFlxblClient();
  
  try {
    const categories = await client.query("Category", {
      where: { slug: { $eq: slug } },
      limit: 1,
    });
    return categories[0] ?? null;
  } catch {
    return null;
  }
}

async function getPublishedContentByCategory(
  categoryId: string
): Promise<ContentCardData[]> {
  const client = getFlxblClient();

  try {
    // Get all content that is categorized under this category
    const categoryRels = await client.getRelationships(
      "Category",
      categoryId,
      "CATEGORIZED_AS",
      "in",
      "Content"
    );

    const contentItems = categoryRels.map((rel) => rel.target);

    // Filter to published content only and enrich with relations
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

      // Get all categories
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
    console.error("Failed to fetch content by category:", error);
    return [];
  }
}

// =============================================================================
// Metadata
// =============================================================================

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} | Kickass CMS`,
    description: category.description ?? `Browse all content in the ${category.name} category`,
  };
}

// =============================================================================
// Page Component
// =============================================================================

export default async function CategoryArchivePage({ params }: PageParams) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const content = await getPublishedContentByCategory(category.id);

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
                <BreadcrumbPage>{category.name}</BreadcrumbPage>
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

          {/* Category Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl text-muted-foreground">
                {category.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              {content.length} {content.length === 1 ? "article" : "articles"}
            </p>
          </header>

          {/* Content Grid */}
          <ContentGrid
            content={content}
            emptyMessage={`No published content in the ${category.name} category yet.`}
            showCategory={false}
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
    const categories = await client.list("Category");
    return categories.map((category) => ({
      slug: category.slug,
    }));
  } catch {
    return [];
  }
}

