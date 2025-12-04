import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { ContentGrid, type ContentCardData } from "@/components/content/content-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Mail, User } from "lucide-react";
import type { Author } from "@/lib/flxbl/types";

// =============================================================================
// Data Fetching
// =============================================================================

async function getAuthorById(id: string): Promise<Author | null> {
  const client = getFlxblClient();

  try {
    return await client.get("Author", id);
  } catch {
    return null;
  }
}

async function getPublishedContentByAuthor(
  authorId: string
): Promise<ContentCardData[]> {
  const client = getFlxblClient();

  try {
    // Get all content authored by this author
    const authorRels = await client.getRelationships(
      "Author",
      authorId,
      "AUTHORED_BY",
      "in",
      "Content"
    );

    const contentItems = authorRels.map((rel) => rel.target);

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
        author: null, // Don't show author on author page cards
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
    console.error("Failed to fetch content by author:", error);
    return [];
  }
}

// =============================================================================
// Metadata
// =============================================================================

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthorById(id);

  if (!author) {
    return {
      title: "Author Not Found",
    };
  }

  return {
    title: `${author.name} | Kickass CMS`,
    description: author.bio ?? `Articles by ${author.name}`,
  };
}

// =============================================================================
// Page Component
// =============================================================================

export default async function AuthorArchivePage({ params }: PageParams) {
  const { id } = await params;
  const author = await getAuthorById(id);

  if (!author) {
    notFound();
  }

  const content = await getPublishedContentByAuthor(author.id);

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
                <BreadcrumbPage>{author.name}</BreadcrumbPage>
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

          {/* Author Header */}
          <header className="mb-12">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="size-24 sm:size-32">
                <AvatarImage src={author.avatarUrl ?? undefined} alt={author.name} />
                <AvatarFallback className="text-3xl">
                  <User className="size-12" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  {author.name}
                </h1>

                {author.email && (
                  <a
                    href={`mailto:${author.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <Mail className="size-4" />
                    {author.email}
                  </a>
                )}

                {author.bio && (
                  <p className="text-muted-foreground max-w-2xl mt-2">
                    {author.bio}
                  </p>
                )}

                <p className="text-sm text-muted-foreground mt-4">
                  {content.length} published {content.length === 1 ? "article" : "articles"}
                </p>
              </div>
            </div>
          </header>

          {/* Content Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Articles by {author.name}</h2>
            <ContentGrid
              content={content}
              emptyMessage={`${author.name} hasn't published any content yet.`}
              showAuthor={false}
            />
          </section>
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
    const authors = await client.list("Author");
    return authors.map((author) => ({
      id: author.id,
    }));
  } catch {
    return [];
  }
}

