import Link from "next/link";
import { getFlxblClient } from "@/lib/flxbl/config";
import { getPageBySlug, getPageSectionsWithBlocks, getPageLayout, getPagePlacements } from "@/lib/flxbl/pages";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { PageLayoutRenderer } from "@/components/page/page-layout-renderer";
import { PageSectionRenderer, type SectionWithContent } from "@/components/page/page-section-renderer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import type { Content, Block } from "@/lib/flxbl/types";

// =============================================================================
// CMS-Managed 404 Page
// =============================================================================

export default async function NotFound() {
  const client = getFlxblClient();

  try {
    // Try to fetch CMS-managed 404 page
    const page = await getPageBySlug(client, "404");

    if (page) {
      // Fetch page data in parallel
      const [sectionsWithBlocks, layout, placements] = await Promise.all([
        getPageSectionsWithBlocks(client, page.id),
        getPageLayout(client, page.id),
        getPagePlacements(client, page.id),
      ]);

      // Load content for each section (simplified - 404 page typically uses static/global blocks)
      const sectionsWithContent: SectionWithContent[] = sectionsWithBlocks.map((section) => ({
        ...section,
        content: [] as Content[],
        block: section.block as Block | null,
      }));

      const pageContent = (
        <>
          {/* Page Title */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
            {page.description && (
              <p className="mt-2 text-xl text-muted-foreground">
                {page.description}
              </p>
            )}
          </div>

          {/* Page Sections */}
          {sectionsWithContent.length > 0 && (
            <div className="space-y-8">
              {sectionsWithContent.map((section) => (
                <PageSectionRenderer key={section.id} section={section} />
              ))}
            </div>
          )}

          {/* Always include navigation options */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="/home">
                <Home className="mr-2 size-4" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 size-4" />
                Browse Blog
              </Link>
            </Button>
          </div>
        </>
      );

      return (
        <div className="min-h-screen bg-background flex flex-col">
          <SiteHeader showAdminLink />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-16">
              <PageLayoutRenderer layout={layout} placements={placements}>
                {pageContent}
              </PageLayoutRenderer>
            </div>
          </main>
          <SiteFooter />
        </div>
      );
    }
  } catch (error) {
    // If database error, fall through to hardcoded fallback
    console.error("Failed to fetch 404 page from CMS:", error);
  }

  // Hardcoded fallback 404 page
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader showAdminLink />
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          {/* Decorative 404 */}
          <div className="mb-8">
            <span className="text-9xl font-bold bg-gradient-to-br from-primary/20 via-primary/40 to-primary/20 bg-clip-text text-transparent">
              404
            </span>
          </div>

          {/* Message */}
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Lost in the Graph?
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Don&apos;t worry, even the best graph traversals sometimes hit a dead end.
          </p>

          {/* Navigation Options */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/home">
                <Home className="mr-2 size-4" />
                Go to Home
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 size-4" />
                Browse Blog
              </Link>
            </Button>
          </div>

          {/* Fun fact */}
          <p className="mt-12 text-sm text-muted-foreground">
            Fun fact: In a graph database, a 404 is just a missing edge. We&apos;ll help you find a path.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

