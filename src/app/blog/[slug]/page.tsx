import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getFlxblClient } from "@/lib/flxbl/config";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";

import { getPublishedContentBySlugAndType, getContentBlocks } from "@/lib/flxbl/queries";
import { generateContentMetadata, getDefaultMetadata } from "@/lib/flxbl/metadata";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Calendar, User } from "lucide-react";

// =============================================================================
// Metadata Generation
// =============================================================================

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const client = getFlxblClient();
  const content = await getPublishedContentBySlugAndType(client, slug, "POST");

  if (!content) {
    return getDefaultMetadata();
  }

  // Get featured image for OG
  const featuredImage = content._relationships?.HAS_MEDIA?.find(
    (rel) => rel.properties.role === "FEATURED"
  )?.target;

  return generateContentMetadata({
    content,
    featuredImageUrl: featuredImage?.url,
    basePath: "/blog",
    siteName: "Kickass CMS",
  });
}

// =============================================================================
// Page Component
// =============================================================================

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const client = getFlxblClient();

  const content = await getPublishedContentBySlugAndType(client, slug, "POST");

  if (!content) {
    notFound();
  }

  // Get content blocks
  const blocksWithPosition = await getContentBlocks(client, content.id);
  const blocks = blocksWithPosition.map((b) => b.block);

  // Get primary author
  const primaryAuthor = content._relationships?.AUTHORED_BY?.find(
    (rel) => rel.properties.role === "PRIMARY"
  )?.target;

  // Get featured image
  const featuredImage = content._relationships?.HAS_MEDIA?.find(
    (rel) => rel.properties.role === "FEATURED"
  )?.target;

  // Get categories
  const categories = content._relationships?.CATEGORIZED_AS?.map((rel) => rel.target) ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader showAdminLink />

      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>{content.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Blog
          </Link>

          {/* Post Header */}
          <header className="mb-8">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <Link key={category.id} href={`/category/${category.slug}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                      {category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {content.title}
            </h1>

            {/* Excerpt */}
            {content.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">
                {content.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {/* Author */}
              {primaryAuthor && (
                <Link
                  href={`/author/${primaryAuthor.id}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={primaryAuthor.avatarUrl ?? undefined} alt={primaryAuthor.name} />
                    <AvatarFallback>
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span>{primaryAuthor.name}</span>
                </Link>
              )}

              {/* Date */}
              {content.publishedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <time dateTime={content.publishedAt.toISOString()}>
                    {content.publishedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              )}
            </div>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {content.tags.map((tag) => (
                  <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {featuredImage && (
            <figure className="mb-8 -mx-4 md:mx-0">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <Image
                  src={featuredImage.url}
                  alt={featuredImage.alt ?? content.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover"
                  priority
                />
              </div>
              {featuredImage.caption && (
                <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                  {featuredImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Post Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <BlockRenderer blocks={blocks} />
          </div>

          {/* Author Bio */}
          {primaryAuthor?.bio && (
            <div className="mt-12 pt-8 border-t">
              <div className="flex items-start gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={primaryAuthor.avatarUrl ?? undefined} alt={primaryAuthor.name} />
                  <AvatarFallback>
                    <User className="size-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    About {primaryAuthor.name}
                  </h3>
                  <p className="text-muted-foreground">{primaryAuthor.bio}</p>
                </div>
              </div>
            </div>
          )}
        </article>
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
    const content = await client.query("Content", {
      where: { contentType: { $eq: "POST" } },
    });

    return content.map((item) => ({
      slug: item.slug,
    }));
  } catch {
    return [];
  }
}

