import { ReactNode } from "react";
import type { Layout, Block } from "@/lib/flxbl/types";
import type { PagePlacementWithContent } from "@/lib/flxbl/pages";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface PageLayoutRendererProps {
  layout: Layout | null;
  placements: PagePlacementWithContent[];
  children: ReactNode;
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
          <div className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              disabled
            />
            <button
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              disabled
            >
              {(content.buttonText as string) || "Subscribe"}
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
      if (content.html) {
        return (
          <div
            className="custom-block"
            dangerouslySetInnerHTML={{ __html: content.html as string }}
          />
        );
      }
      return (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">{block.name}</p>
        </div>
      );

    default:
      return (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">{block.name}</p>
        </div>
      );
  }
}

// =============================================================================
// Region Renderer
// =============================================================================

function RegionContent({
  placements,
  className,
}: {
  placements: PagePlacementWithContent[];
  className?: string;
}) {
  if (placements.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {placements.map((item, index) => {
        if (item.block) {
          return <GlobalBlockRenderer key={index} block={item.block} />;
        }
        return null;
      })}
    </div>
  );
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
    <div className={cn("max-w-4xl mx-auto", className)}>{mainContent}</div>
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
    <div className={cn("max-w-6xl mx-auto", className)}>
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
      {heroContent && <div className="w-full mb-8">{heroContent}</div>}
      <div className="max-w-6xl mx-auto">{mainContent}</div>
      {footerContent && (
        <div className="max-w-6xl mx-auto mt-8">{footerContent}</div>
      )}
    </div>
  );
}

// =============================================================================
// Main Layout Renderer
// =============================================================================

export function PageLayoutRenderer({
  layout,
  placements,
  children,
}: PageLayoutRendererProps) {
  // Group placements by region
  const placementsByRegion = new Map<string, PagePlacementWithContent[]>();
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

  // If no layout, render in single column
  if (!layout) {
    return <SingleColumnLayout mainContent={children} />;
  }

  const template = layout.template;

  switch (template) {
    case "single-column":
      return (
        <SingleColumnLayout
          mainContent={
            <>
              <RegionContent placements={placementsByRegion.get("main") ?? []} />
              {children}
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
              {children}
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
              {children}
            </>
          }
          footerContent={
            <RegionContent placements={placementsByRegion.get("footer") ?? []} />
          }
        />
      );

    default:
      // Fallback to single column
      return <SingleColumnLayout mainContent={children} />;
  }
}

