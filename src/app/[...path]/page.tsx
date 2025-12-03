import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFlxblClient } from "@/lib/flxbl/config";

// Revalidate every 60 seconds for ISR
export const revalidate = 60;
import {
  getPageByPath,
  getPageAncestors,
  getPageSectionsWithBlocks,
  getSectionContent,
  getFilteredContentForPage,
  getPageLayout,
  getPagePlacements,
} from "@/lib/flxbl/pages";
import { isPreviewMode, getPageForPreview } from "@/lib/flxbl/preview";
import { generatePageMetadata, getDefaultMetadata } from "@/lib/flxbl/metadata";
import { PageSectionRenderer, type SectionWithContent } from "@/components/page/page-section-renderer";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { PageLayoutRenderer } from "@/components/page/page-layout-renderer";
import { PreviewBanner } from "@/components/page/preview-banner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Content, Block } from "@/lib/flxbl/types";

// =============================================================================
// Metadata Generation
// =============================================================================

interface PageParams {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { path: pathSegments } = await params;
  const fullPath = "/" + pathSegments.join("/");

  const client = getFlxblClient();
  const page = await getPageByPath(client, fullPath);

  if (!page) {
    return getDefaultMetadata();
  }

  return generatePageMetadata({
    page,
    siteName: "Kickass CMS",
  });
}

// =============================================================================
// Page Component
// =============================================================================

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: pathSegments } = await params;
  const fullPath = "/" + pathSegments.join("/");

  const client = getFlxblClient();
  const preview = await isPreviewMode();

  // Find the page by path (preview mode bypasses isPublished check)
  const page = preview
    ? await getPageForPreview(client, fullPath, true)
    : await getPageByPath(client, fullPath);

  if (!page || (!preview && !page.isPublished)) {
    notFound();
  }

  // Fetch page data in parallel
  const [ancestors, sectionsWithBlocks, layout, placements] = await Promise.all([
    getPageAncestors(client, page.id),
    getPageSectionsWithBlocks(client, page.id),
    getPageLayout(client, page.id),
    getPagePlacements(client, page.id),
  ]);

  // Load content for each section
  const sectionsWithContent: SectionWithContent[] = await Promise.all(
    sectionsWithBlocks.map(async (section) => {
      let content: Content[] = [];
      let block: Block | null | undefined = section.block;

      if (section.sectionType === "CONTENT_LIST") {
        // Use page's category filters if available
        content = await getFilteredContentForPage(client, page.id, {
          limit: ((section.config as Record<string, unknown>)?.limit as number) ?? 10,
          contentType: (section.config as Record<string, unknown>)?.contentType as
            | "PAGE"
            | "POST"
            | "ARTICLE"
            | undefined,
        });
      } else if (section.sectionType === "SINGLE_CONTENT") {
        // Get content assigned to this section
        const sectionContent = await getSectionContent(client, section.id);
        content = sectionContent.map((c) => c.content);
      } else if (section.sectionType === "GLOBAL_BLOCK" && !block) {
        // Try to fetch block from config if not already loaded
        const config = section.config as Record<string, unknown> | null;
        if (config?.blockId) {
          try {
            block = await client.get("Block", config.blockId as string);
          } catch {
            // Block not found
          }
        }
      }

      return {
        ...section,
        content,
        block,
      };
    })
  );

  // Page content
  const pageContent = (
    <>
      {/* Breadcrumbs */}
      {ancestors.length > 0 && (
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {ancestors.map((ancestor) => (
              <BreadcrumbItem key={ancestor.id}>
                <BreadcrumbSeparator />
                <BreadcrumbLink href={ancestor.path}>
                  {ancestor.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{page.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        {page.description && (
          <p className="mt-2 text-xl text-muted-foreground">
            {page.description}
          </p>
        )}
      </div>

      {/* Page Sections */}
      {sectionsWithContent.length > 0 ? (
        <div className="space-y-8">
          {sectionsWithContent.map((section) => (
            <PageSectionRenderer key={section.id} section={section} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <p>This page has no content sections configured yet.</p>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <SiteHeader showAdminLink />

      {/* Main Content with Layout */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <PageLayoutRenderer
            layout={layout}
            placements={placements}
          >
            {pageContent}
          </PageLayoutRenderer>
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />

      {/* Preview Mode Banner */}
      {preview && <PreviewBanner exitUrl={`/api/preview/disable?redirect=${encodeURIComponent(fullPath)}`} />}
    </div>
  );
}

// =============================================================================
// Static Generation
// =============================================================================

export async function generateStaticParams() {
  const client = getFlxblClient();

  try {
    const pages = await client.list("Page");

    return pages
      .filter((page) => page.isPublished)
      .map((page) => ({
        path: page.path.split("/").filter(Boolean),
      }));
  } catch {
    return [];
  }
}
