import { ReactNode } from "react";
import { BlockRenderer } from "@/components/blocks";
import type { LayoutTemplate } from "@/lib/flxbl/layout";
import type { Layout, ContentBlock, Block } from "@/lib/flxbl/types";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface PlacementWithContent {
  placement: {
    region: string;
    position: number;
    settings?: Record<string, unknown> | null;
  };
  block?: Block;
  contentBlock?: ContentBlock;
}

interface LayoutRendererProps {
  layout: Layout | null;
  placements: PlacementWithContent[];
  blocks: ContentBlock[];
  children?: ReactNode;
}

interface RegionContentProps {
  placements: PlacementWithContent[];
  className?: string;
}

// =============================================================================
// Region Content Renderer
// =============================================================================

function RegionContent({ placements, className }: RegionContentProps) {
  if (placements.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {placements.map((item, index) => {
        // Render content block
        if (item.contentBlock) {
          return <BlockRenderer key={index} blocks={[item.contentBlock]} />;
        }

        // Render global block
        if (item.block) {
          return <GlobalBlockRenderer key={index} block={item.block} />;
        }

        return null;
      })}
    </div>
  );
}

// =============================================================================
// Global Block Renderer
// =============================================================================

function GlobalBlockRenderer({ block }: { block: Block }) {
  const content = block.content as Record<string, unknown>;

  switch (block.blockType) {
    case "AUTHOR_BIO":
      return (
        <div className="p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">About the Author</h3>
          <p className="text-muted-foreground">
            {(content.bio as string) || "Author bio not available."}
          </p>
        </div>
      );

    case "RELATED_POSTS":
      return (
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Related Posts</h3>
          <p className="text-sm text-muted-foreground">
            Related posts will appear here.
          </p>
        </div>
      );

    case "NEWSLETTER":
      return (
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
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              disabled
            />
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              disabled
            >
              Subscribe
            </button>
          </div>
        </div>
      );

    case "CTA":
      return (
        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg text-center">
          <h3 className="font-semibold text-lg mb-2">
            {(content.title as string) || "Ready to get started?"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {(content.description as string) || "Take the next step today."}
          </p>
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium">
            {(content.buttonText as string) || "Learn More"}
          </button>
        </div>
      );

    case "CUSTOM":
      // Render custom HTML/content
      if (content.html) {
        return (
          <div
            className="custom-block"
            dangerouslySetInnerHTML={{ __html: content.html as string }}
          />
        );
      }
      return null;

    default:
      return null;
  }
}

// =============================================================================
// Layout Templates
// =============================================================================

function SingleColumnLayout({
  mainContent,
  className,
}: {
  mainContent: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl mx-auto px-6", className)}>{mainContent}</div>
  );
}

function TwoColumnSidebarLayout({
  mainContent,
  sidebarContent,
  className,
}: {
  mainContent: ReactNode;
  sidebarContent: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-6xl mx-auto px-6", className)}>
      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <main>{mainContent}</main>
        <aside className="space-y-6">{sidebarContent}</aside>
      </div>
    </div>
  );
}

function FullWidthLayout({
  heroContent,
  mainContent,
  footerContent,
  className,
}: {
  heroContent: ReactNode;
  mainContent: ReactNode;
  footerContent: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {heroContent && <div className="w-full">{heroContent}</div>}
      <div className="max-w-6xl mx-auto px-6 py-8">{mainContent}</div>
      {footerContent && (
        <div className="max-w-6xl mx-auto px-6 pb-8">{footerContent}</div>
      )}
    </div>
  );
}

// =============================================================================
// Main Layout Renderer
// =============================================================================

export function LayoutRenderer({
  layout,
  placements,
  blocks,
  children,
}: LayoutRendererProps) {
  // Group placements by region
  const placementsByRegion = new Map<string, PlacementWithContent[]>();
  for (const p of placements) {
    const region = p.placement.region;
    if (!placementsByRegion.has(region)) {
      placementsByRegion.set(region, []);
    }
    placementsByRegion.get(region)!.push(p);
  }

  // Sort placements within each region by position
  placementsByRegion.forEach((items) => {
    items.sort((a, b) => a.placement.position - b.placement.position);
  });

  // Default content (the main blocks)
  const defaultContent = blocks.length > 0 ? (
    <BlockRenderer blocks={blocks} />
  ) : (
    children
  );

  // If no layout, render in single column
  if (!layout) {
    return <SingleColumnLayout mainContent={defaultContent} />;
  }

  const template = layout.template as LayoutTemplate;

  switch (template) {
    case "single-column":
      return (
        <SingleColumnLayout
          mainContent={
            <>
              <RegionContent placements={placementsByRegion.get("main") ?? []} />
              {defaultContent}
            </>
          }
        />
      );

    case "two-column-sidebar":
      return (
        <TwoColumnSidebarLayout
          mainContent={
            <>
              <RegionContent placements={placementsByRegion.get("main") ?? []} />
              {defaultContent}
            </>
          }
          sidebarContent={
            <RegionContent placements={placementsByRegion.get("sidebar") ?? []} />
          }
        />
      );

    case "full-width":
      return (
        <FullWidthLayout
          heroContent={
            <RegionContent placements={placementsByRegion.get("hero") ?? []} />
          }
          mainContent={
            <>
              <RegionContent placements={placementsByRegion.get("main") ?? []} />
              {defaultContent}
            </>
          }
          footerContent={
            <RegionContent placements={placementsByRegion.get("footer") ?? []} />
          }
        />
      );

    default:
      // Fallback to single column
      return <SingleColumnLayout mainContent={defaultContent} />;
  }
}

