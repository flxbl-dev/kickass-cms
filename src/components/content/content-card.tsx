import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import type { Content, Author, Category, Media } from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

export interface ContentCardData extends Content {
  author?: Author | null;
  featuredImage?: Media | null;
  categories?: Category[];
}

interface ContentCardProps {
  content: ContentCardData;
  showCategory?: boolean;
  showAuthor?: boolean;
  showTags?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the content link based on content type
 */
function getContentLink(item: Content): string {
  switch (item.contentType) {
    case "POST":
      return `/blog/${item.slug}`;
    case "ARTICLE":
      return `/articles/${item.slug}`;
    case "PAGE":
      return `/${item.slug}`;
    default:
      return `/content/${item.slug}`;
  }
}

// =============================================================================
// Content Card Component
// =============================================================================

export function ContentCard({
  content,
  showCategory = true,
  showAuthor = true,
  showTags = true,
}: ContentCardProps) {
  const contentLink = getContentLink(content);

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 flex flex-col h-full">
      {/* Featured Image */}
      {content.featuredImage && (
        <Link href={contentLink} className="relative aspect-video overflow-hidden rounded-t-lg block">
          <Image
            src={content.featuredImage.url}
            alt={content.featuredImage.alt ?? content.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
      )}

      <CardHeader className="flex-1">
        {/* Category badges */}
        {showCategory && content.categories && content.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {content.categories.slice(0, 2).map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <CardTitle className="line-clamp-2">
          <Link
            href={contentLink}
            className="hover:text-primary transition-colors"
          >
            {content.title}
          </Link>
        </CardTitle>

        {/* Excerpt */}
        {content.excerpt && (
          <CardDescription className="line-clamp-3 mt-2">
            {content.excerpt}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Meta row: author and date */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {showAuthor && content.author && (
            <Link
              href={`/author/${content.author.id}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Avatar className="size-5">
                <AvatarImage src={content.author.avatarUrl ?? undefined} alt={content.author.name} />
                <AvatarFallback className="text-[10px]">
                  <User className="size-3" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[100px]">{content.author.name}</span>
            </Link>
          )}

          {content.publishedAt && (
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              <time dateTime={content.publishedAt.toISOString()}>
                {content.publishedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
          )}
        </div>

        {/* Tags */}
        {showTags && content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Content Grid Component
// =============================================================================

interface ContentGridProps {
  content: ContentCardData[];
  emptyMessage?: string;
  showCategory?: boolean;
  showAuthor?: boolean;
  showTags?: boolean;
}

export function ContentGrid({
  content,
  emptyMessage = "No content available.",
  showCategory = true,
  showAuthor = true,
  showTags = true,
}: ContentGridProps) {
  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {content.map((item) => (
        <ContentCard
          key={item.id}
          content={item}
          showCategory={showCategory}
          showAuthor={showAuthor}
          showTags={showTags}
        />
      ))}
    </div>
  );
}

