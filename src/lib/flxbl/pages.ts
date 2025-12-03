import type { FlxblClient } from "./client";
import type {
  Page,
  PageSection,
  Category,
  Layout,
  Content,
  PageWithRelations,
  PageSectionWithRelations,
  SectionHasContentProps,
} from "./types";
import { getContentByState } from "./queries";

// =============================================================================
// Page Query Helpers
// =============================================================================

/**
 * Get a page by its full URL path
 */
export async function getPageByPath(
  client: FlxblClient,
  path: string,
): Promise<Page | null> {
  const results = await client.query("Page", {
    where: { path: { $eq: path } },
    limit: 1,
  });
  return results[0] ?? null;
}

/**
 * Get a page by slug
 */
export async function getPageBySlug(
  client: FlxblClient,
  slug: string,
): Promise<Page | null> {
  const results = await client.query("Page", {
    where: { slug: { $eq: slug } },
    limit: 1,
  });
  return results[0] ?? null;
}

/**
 * Get all published pages
 */
export async function getPublishedPages(
  client: FlxblClient,
  options?: { limit?: number; offset?: number },
): Promise<Page[]> {
  return client.query("Page", {
    where: { isPublished: { $eq: true } },
    orderBy: "navOrder",
    orderDirection: "ASC",
    limit: options?.limit,
    offset: options?.offset,
  });
}

/**
 * Get all pages (for admin)
 */
export async function getAllPages(
  client: FlxblClient,
  options?: { limit?: number; offset?: number },
): Promise<Page[]> {
  return client.list("Page", {
    orderBy: "path",
    orderDirection: "ASC",
    limit: options?.limit,
    offset: options?.offset,
  });
}

// =============================================================================
// Page Hierarchy Helpers
// =============================================================================

/**
 * Get the parent page using PAGE_PARENT relationship
 */
export async function getPageParent(
  client: FlxblClient,
  pageId: string,
): Promise<Page | null> {
  const rels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_PARENT",
    "out",
    "Page",
  );
  return rels[0]?.target ?? null;
}

/**
 * Get child pages using PAGE_PARENT relationship (children point to parent)
 */
export async function getPageChildren(
  client: FlxblClient,
  pageId: string,
): Promise<Page[]> {
  const rels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_PARENT",
    "in",
    "Page",
  );
  return rels.map((r) => r.target).sort((a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0));
}

/**
 * Get root pages (pages without a parent)
 */
export async function getRootPages(
  client: FlxblClient,
): Promise<Page[]> {
  const allPages = await client.list("Page", {
    orderBy: "navOrder",
    orderDirection: "ASC",
  });

  // Filter to pages that have no outgoing PAGE_PARENT relationship
  const rootPages: Page[] = [];
  for (const page of allPages) {
    const parent = await getPageParent(client, page.id);
    if (!parent) {
      rootPages.push(page);
    }
  }

  return rootPages;
}

/**
 * Build the full ancestor path for breadcrumb navigation
 */
export async function getPageAncestors(
  client: FlxblClient,
  pageId: string,
): Promise<Page[]> {
  const ancestors: Page[] = [];
  let currentId = pageId;

  while (currentId) {
    const parent = await getPageParent(client, currentId);
    if (parent) {
      ancestors.unshift(parent); // Add to beginning for correct order
      currentId = parent.id;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Page tree node for navigation
 */
export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

/**
 * Build a complete navigation tree of pages
 */
export async function getNavigationTree(
  client: FlxblClient,
  publishedOnly = true,
): Promise<PageTreeNode[]> {
  let allPages = await client.list("Page", {
    orderBy: "navOrder",
    orderDirection: "ASC",
  });

  if (publishedOnly) {
    allPages = allPages.filter((p) => p.isPublished && p.showInNav);
  }

  // Build parent map
  const parentMap = new Map<string, string>();
  for (const page of allPages) {
    const parent = await getPageParent(client, page.id);
    if (parent) {
      parentMap.set(page.id, parent.id);
    }
  }

  // Build tree
  const pageMap = new Map<string, PageTreeNode>();
  for (const page of allPages) {
    pageMap.set(page.id, { ...page, children: [] });
  }

  const rootNodes: PageTreeNode[] = [];
  for (const page of allPages) {
    const node = pageMap.get(page.id)!;
    const parentId = parentMap.get(page.id);

    if (parentId && pageMap.has(parentId)) {
      pageMap.get(parentId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

/**
 * Build the full path from parent path and slug
 */
export function buildPagePath(slug: string, parentPath?: string | null): string {
  if (!parentPath || parentPath === "/") {
    return `/${slug}`;
  }
  return `${parentPath}/${slug}`;
}

// =============================================================================
// Page Section Helpers
// =============================================================================

/**
 * Get all sections for a page, sorted by position
 */
export async function getPageSections(
  client: FlxblClient,
  pageId: string,
): Promise<PageSection[]> {
  const rels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_HAS_SECTION",
    "out",
    "PageSection",
  );

  return rels
    .map((r) => r.target)
    .sort((a, b) => a.position - b.position);
}

/**
 * Get content items for a section
 */
export async function getSectionContent(
  client: FlxblClient,
  sectionId: string,
): Promise<Array<{ content: Content; position?: number | null }>> {
  const rels = await client.getRelationships(
    "PageSection",
    sectionId,
    "SECTION_HAS_CONTENT",
    "out",
    "Content",
  );

  return rels
    .sort((a, b) => {
      const posA = (a.relationship.properties as SectionHasContentProps).position ?? Infinity;
      const posB = (b.relationship.properties as SectionHasContentProps).position ?? Infinity;
      return posA - posB;
    })
    .map((r) => ({
      content: r.target,
      position: (r.relationship.properties as SectionHasContentProps).position,
    }));
}

/**
 * Get sections with their content for a page
 */
export async function getPageSectionsWithContent(
  client: FlxblClient,
  pageId: string,
): Promise<PageSectionWithRelations[]> {
  const sections = await getPageSections(client, pageId);
  const sectionsWithContent: PageSectionWithRelations[] = [];

  for (const section of sections) {
    const contentRels = await client.getRelationships(
      "PageSection",
      section.id,
      "SECTION_HAS_CONTENT",
      "out",
      "Content",
    );

    sectionsWithContent.push({
      ...section,
      _relationships: {
        SECTION_HAS_CONTENT: contentRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties as SectionHasContentProps,
        })),
      },
    });
  }

  return sectionsWithContent;
}

// =============================================================================
// Page Layout Helpers
// =============================================================================

/**
 * Get the layout for a page
 */
export async function getPageLayout(
  client: FlxblClient,
  pageId: string,
): Promise<Layout | null> {
  const rels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_USES_LAYOUT",
    "out",
    "Layout",
  );
  return rels[0]?.target ?? null;
}

/**
 * Set the layout for a page
 */
export async function setPageLayout(
  client: FlxblClient,
  pageId: string,
  layoutId: string,
): Promise<void> {
  // Remove existing layout relationship
  const existingRels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_USES_LAYOUT",
    "out",
    "Layout",
  );

  for (const rel of existingRels) {
    await client.deleteRelationship(
      "Page",
      pageId,
      "PAGE_USES_LAYOUT",
      rel.target.id,
    );
  }

  // Create new relationship
  await client.createRelationship(
    "Page",
    pageId,
    "PAGE_USES_LAYOUT",
    layoutId,
    {},
  );
}

// =============================================================================
// Page Category Filter Helpers
// =============================================================================

/**
 * Get categories that filter content on this page
 */
export async function getPageFilterCategories(
  client: FlxblClient,
  pageId: string,
): Promise<Category[]> {
  const rels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_FILTERS_CATEGORY",
    "out",
    "Category",
  );
  return rels.map((r) => r.target);
}

/**
 * Set category filters for a page
 */
export async function setPageFilterCategories(
  client: FlxblClient,
  pageId: string,
  categoryIds: string[],
): Promise<void> {
  // Remove existing category relationships
  const existingRels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_FILTERS_CATEGORY",
    "out",
    "Category",
  );

  for (const rel of existingRels) {
    await client.deleteRelationship(
      "Page",
      pageId,
      "PAGE_FILTERS_CATEGORY",
      rel.target.id,
    );
  }

  // Create new relationships
  for (const categoryId of categoryIds) {
    await client.createRelationship(
      "Page",
      pageId,
      "PAGE_FILTERS_CATEGORY",
      categoryId,
      {},
    );
  }
}

// =============================================================================
// Page Parent Helpers
// =============================================================================

/**
 * Set the parent page
 */
export async function setPageParent(
  client: FlxblClient,
  pageId: string,
  parentId: string | null,
): Promise<void> {
  // Remove existing parent relationship
  const existingParent = await getPageParent(client, pageId);
  if (existingParent) {
    await client.deleteRelationship(
      "Page",
      pageId,
      "PAGE_PARENT",
      existingParent.id,
    );
  }

  // Create new relationship if parentId provided
  if (parentId) {
    await client.createRelationship(
      "Page",
      pageId,
      "PAGE_PARENT",
      parentId,
      {},
    );
  }
}

// =============================================================================
// Page with All Relations
// =============================================================================

/**
 * Get a page with all its relations
 */
export async function getPageWithRelations(
  client: FlxblClient,
  pageId: string,
): Promise<PageWithRelations | null> {
  try {
    const page = await client.get("Page", pageId);

    const [parentRels, layoutRels, sectionRels, categoryRels] = await Promise.all([
      client.getRelationships("Page", pageId, "PAGE_PARENT", "out", "Page"),
      client.getRelationships("Page", pageId, "PAGE_USES_LAYOUT", "out", "Layout"),
      client.getRelationships("Page", pageId, "PAGE_HAS_SECTION", "out", "PageSection"),
      client.getRelationships("Page", pageId, "PAGE_FILTERS_CATEGORY", "out", "Category"),
    ]);

    return {
      ...page,
      _relationships: {
        PAGE_PARENT: parentRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        PAGE_USES_LAYOUT: layoutRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        PAGE_HAS_SECTION: sectionRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        PAGE_FILTERS_CATEGORY: categoryRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Get content filtered by page's category filters
 * Uses workflow state relationship to determine published content
 */
export async function getFilteredContentForPage(
  client: FlxblClient,
  pageId: string,
  options?: { limit?: number; offset?: number; contentType?: "PAGE" | "POST" | "ARTICLE" },
): Promise<Content[]> {
  const categories = await getPageFilterCategories(client, pageId);

  // Get all published content via workflow state relationship
  const publishedContent = await getContentByState(client, "published");

  // Create a set of published content IDs for quick lookup
  const publishedIds = new Set(publishedContent.map((c) => c.id));

  let filteredContent: Content[];

  if (categories.length === 0) {
    // No category filters - use all published content
    filteredContent = publishedContent;
  } else {
    // Get content that belongs to any of the filter categories
    const categoryContentIds = new Set<string>();
    for (const category of categories) {
      const rels = await client.getRelationships(
        "Category",
        category.id,
        "CATEGORIZED_AS",
        "in",
        "Content",
      );
      for (const rel of rels) {
        // Only include if it's in the published state
        if (publishedIds.has(rel.target.id)) {
          categoryContentIds.add(rel.target.id);
        }
      }
    }

    if (categoryContentIds.size === 0) {
      return [];
    }

    // Filter published content to only those in the category set
    filteredContent = publishedContent.filter((c) => categoryContentIds.has(c.id));
  }

  // Apply contentType filter if specified
  if (options?.contentType) {
    filteredContent = filteredContent.filter((c) => c.contentType === options.contentType);
  }

  // Sort by publishedAt descending (most recent first)
  filteredContent.sort((a, b) => {
    const dateA = a.publishedAt?.getTime() ?? 0;
    const dateB = b.publishedAt?.getTime() ?? 0;
    return dateB - dateA;
  });

  // Apply pagination
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;
  return filteredContent.slice(offset, offset + limit);
}

// =============================================================================
// Page Layout Placements
// =============================================================================

/**
 * Placement with associated content for rendering
 */
export interface PagePlacementWithContent {
  placement: {
    region: string;
    position: number;
    settings?: Record<string, unknown> | null;
  };
  block?: import("./types").Block;
}

/**
 * Get all layout placements for a page
 * This fetches global blocks assigned to layout regions via PAGE_HAS_PLACEMENT
 */
export async function getPagePlacements(
  client: FlxblClient,
  pageId: string,
): Promise<PagePlacementWithContent[]> {
  // Get PAGE_HAS_PLACEMENT relationships from Page to LayoutPlacement
  const placementRels = await client.getRelationships(
    "Page",
    pageId,
    "PAGE_HAS_PLACEMENT",
    "out",
    "LayoutPlacement",
  );

  const placements: PagePlacementWithContent[] = [];

  for (const rel of placementRels) {
    const placement = rel.target;

    // Get the block connected to this placement
    const blockRels = await client.getRelationships(
      "LayoutPlacement",
      placement.id,
      "PLACEMENT_CONTAINS_BLOCK",
      "out",
      "Block",
    );

    placements.push({
      placement: {
        region: placement.region,
        position: placement.position,
        settings: placement.settings,
      },
      block: blockRels[0]?.target,
    });
  }

  // Sort by region and position
  return placements.sort((a, b) => {
    if (a.placement.region !== b.placement.region) {
      return a.placement.region.localeCompare(b.placement.region);
    }
    return a.placement.position - b.placement.position;
  });
}

/**
 * Group page placements by region for layout rendering
 */
export function groupPagePlacementsByRegion(
  placements: PagePlacementWithContent[],
): Map<string, PagePlacementWithContent[]> {
  const groups = new Map<string, PagePlacementWithContent[]>();

  for (const placement of placements) {
    const region = placement.placement.region;
    if (!groups.has(region)) {
      groups.set(region, []);
    }
    groups.get(region)!.push(placement);
  }

  return groups;
}

/**
 * Get global blocks assigned to a specific region of a page
 */
export async function getPageRegionBlocks(
  client: FlxblClient,
  pageId: string,
  region: string,
): Promise<import("./types").Block[]> {
  const placements = await getPagePlacements(client, pageId);
  return placements
    .filter((p) => p.placement.region === region && p.block)
    .map((p) => p.block!);
}

/**
 * Get sections with their content and global blocks for a page
 * This is the main function to use when rendering a page
 */
export async function getPageSectionsWithBlocks(
  client: FlxblClient,
  pageId: string,
): Promise<Array<PageSectionWithRelations & { block?: import("./types").Block | null }>> {
  const sections = await getPageSections(client, pageId);
  const sectionsWithBlocks: Array<PageSectionWithRelations & { block?: import("./types").Block | null }> = [];

  for (const section of sections) {
    // Get content relationships for the section
    const contentRels = await client.getRelationships(
      "PageSection",
      section.id,
      "SECTION_HAS_CONTENT",
      "out",
      "Content",
    );

    // For GLOBAL_BLOCK sections, get the associated block
    let block: import("./types").Block | null = null;
    if (section.sectionType === "GLOBAL_BLOCK") {
      const blockRels = await client.getRelationships(
        "PageSection",
        section.id,
        "SECTION_HAS_BLOCK",
        "out",
        "Block",
      );
      block = blockRels[0]?.target ?? null;

      // Fallback: check config for blockId
      if (!block && section.config) {
        const config = section.config as Record<string, unknown>;
        if (config.blockId) {
          try {
            block = await client.get("Block", config.blockId as string);
          } catch {
            // Block not found
          }
        }
      }
    }

    sectionsWithBlocks.push({
      ...section,
      block,
      _relationships: {
        SECTION_HAS_CONTENT: contentRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties as import("./types").SectionHasContentProps,
        })),
      },
    });
  }

  return sectionsWithBlocks;
}

