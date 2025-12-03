import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  PageSection,
  Content,
  Block,
  ContentListConfig,
  SingleContentConfig,
  GlobalBlockConfig,
} from "@/lib/flxbl/types";

// =============================================================================
// Types
// =============================================================================

export interface SectionWithContent extends PageSection {
  content: Content[];
  block?: Block | null;
}

interface PageSectionRendererProps {
  section: SectionWithContent;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the content link based on content type
 * Content items can be linked to their respective page paths
 */
function getContentLink(item: Content): string {
  // For now, use a pattern based on content type
  // This will be updated when the blog page handles content display
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
// Content List Section
// =============================================================================

function ContentListSection({
  section,
}: {
  section: SectionWithContent;
  config: ContentListConfig;
}) {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6">{section.name}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {section.content.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{item.contentType}</Badge>
                {item.publishedAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <CardTitle className="line-clamp-2">
                <Link
                  href={getContentLink(item)}
                  className="hover:text-primary transition-colors"
                >
                  {item.title}
                </Link>
              </CardTitle>
              {item.excerpt && (
                <CardDescription className="line-clamp-3">
                  {item.excerpt}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {section.content.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No content available in this section.
        </p>
      )}
    </section>
  );
}

// =============================================================================
// Single Content Section
// =============================================================================

function SingleContentSection({
  section,
  config,
}: {
  section: SectionWithContent;
  config: SingleContentConfig;
}) {
  const item = section.content[0];

  if (!item) {
    return (
      <section className="py-8">
        <p className="text-center text-muted-foreground">
          No content assigned to this section.
        </p>
      </section>
    );
  }

  const contentLink = getContentLink(item);

  if (config.displayStyle === "hero") {
    return (
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <div className="max-w-3xl mx-auto text-center px-6">
          <Badge className="mb-4">{item.contentType}</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{item.title}</h1>
          {item.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{item.excerpt}</p>
          )}
          <Link
            href={contentLink}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Read More
          </Link>
        </div>
      </section>
    );
  }

  if (config.displayStyle === "card") {
    return (
      <section className="py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Badge className="w-fit mb-2">{item.contentType}</Badge>
            <CardTitle>{item.title}</CardTitle>
            {item.excerpt && <CardDescription>{item.excerpt}</CardDescription>}
          </CardHeader>
          <CardContent>
            <Link
              href={contentLink}
              className="text-primary hover:underline"
            >
              Continue reading →
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Default: full display
  return (
    <section className="py-8">
      <article className="prose prose-lg max-w-none dark:prose-invert">
        <h2>{item.title}</h2>
        {item.excerpt && <p className="lead">{item.excerpt}</p>}
        <Link href={contentLink} className="not-prose">
          <span className="text-primary hover:underline">
            Continue reading →
          </span>
        </Link>
      </article>
    </section>
  );
}

// =============================================================================
// Static Block Section
// =============================================================================

interface StaticBlockConfig {
  html?: string;
  title?: string;
}

function StaticBlockSection({ section }: { section: SectionWithContent }) {
  const config = (section.config ?? {}) as StaticBlockConfig;

  // Render HTML content if available
  if (config.html) {
    return (
      <section className="py-8">
        {config.title && (
          <h2 className="text-2xl font-bold mb-6">{config.title}</h2>
        )}
        <div
          className="static-block prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: config.html }}
        />
      </section>
    );
  }

  // Fallback: show section name with placeholder
  return (
    <section className="py-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>{section.name}</h2>
        <p className="text-muted-foreground italic">
          This section has no content configured yet.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// Global Block Section
// =============================================================================

function GlobalBlockSection({
  section,
}: {
  section: SectionWithContent;
  config: GlobalBlockConfig;
}) {
  const block = section.block;

  if (!block) {
    return (
      <section className="py-8">
        <p className="text-center text-muted-foreground">
          No global block assigned to this section.
        </p>
      </section>
    );
  }

  const content = block.content as Record<string, unknown>;

  switch (block.blockType) {
    case "AUTHOR_BIO":
      return (
        <section className="py-8">
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">About the Author</h3>
            <p className="text-muted-foreground">
              {(content.bio as string) || "Author bio not available."}
            </p>
          </div>
        </section>
      );

    case "RELATED_POSTS":
      return (
        <section className="py-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-4">Related Posts</h3>
            <p className="text-sm text-muted-foreground">
              Related posts will appear here based on content relationships.
            </p>
          </div>
        </section>
      );

    case "NEWSLETTER":
      return (
        <section className="py-8">
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold mb-2">
              {(content.title as string) || "Subscribe to our Newsletter"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {(content.description as string) ||
                "Get the latest updates delivered to your inbox."}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
                disabled
              />
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                disabled
              >
                {(content.buttonText as string) || "Subscribe"}
              </button>
            </div>
          </div>
        </section>
      );

    case "CTA":
      return (
        <section className="py-8">
          <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg text-center">
            <h3 className="font-semibold text-lg mb-2">
              {(content.title as string) || "Ready to get started?"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {(content.description as string) || "Take the next step today."}
            </p>
            {content.buttonUrl ? (
              <Link
                href={content.buttonUrl as string}
                className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium"
              >
                {(content.buttonText as string) || "Learn More"}
              </Link>
            ) : (
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium">
                {(content.buttonText as string) || "Learn More"}
              </button>
            )}
          </div>
        </section>
      );

    case "CUSTOM":
      if (content.html) {
        return (
          <section className="py-8">
            <div
              className="custom-block prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content.html as string }}
            />
          </section>
        );
      }
      return (
        <section className="py-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">{block.name}</h3>
            <p className="text-sm text-muted-foreground">
              Custom block content
            </p>
          </div>
        </section>
      );

    default:
      return (
        <section className="py-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">{block.name}</h3>
            <p className="text-sm text-muted-foreground">
              Block type: {block.blockType}
            </p>
          </div>
        </section>
      );
  }
}

// =============================================================================
// Page Section Renderer
// =============================================================================

export function PageSectionRenderer({ section }: PageSectionRendererProps) {
  const config = (section.config ?? {}) as Record<string, unknown>;

  switch (section.sectionType) {
    case "CONTENT_LIST":
      return (
        <ContentListSection
          section={section}
          config={{
            limit: (config.limit as number) ?? 10,
            orderBy: (config.orderBy as string) ?? "publishedAt",
            orderDirection: (config.orderDirection as "ASC" | "DESC") ?? "DESC",
            contentType: config.contentType as "PAGE" | "POST" | "ARTICLE" | undefined,
            showPagination: (config.showPagination as boolean) ?? true,
          }}
        />
      );

    case "SINGLE_CONTENT":
      return (
        <SingleContentSection
          section={section}
          config={{
            displayStyle: (config.displayStyle as "full" | "card" | "hero") ?? "full",
          }}
        />
      );

    case "STATIC_BLOCK":
      return <StaticBlockSection section={section} />;

    case "GLOBAL_BLOCK":
      return (
        <GlobalBlockSection
          section={section}
          config={{
            blockId: config.blockId as string | undefined,
            blockType: config.blockType as GlobalBlockConfig["blockType"],
          }}
        />
      );

    default:
      return (
        <section className="py-8">
          <p className="text-muted-foreground">
            Unknown section type: {section.sectionType}
          </p>
        </section>
      );
  }
}
