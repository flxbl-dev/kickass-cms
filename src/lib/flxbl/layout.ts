/**
 * Layout System
 * 
 * Manages page layouts and content placements
 */

import type { FlxblClient } from "./client";
import type { Layout, LayoutPlacement, Block, ContentBlock } from "./types";

// =============================================================================
// Layout Operations
// =============================================================================

/**
 * Get all available layouts
 */
export async function getAllLayouts(
  client: FlxblClient
): Promise<Layout[]> {
  return client.list("Layout");
}

/**
 * Get a layout by slug
 */
export async function getLayoutBySlug(
  client: FlxblClient,
  slug: string
): Promise<Layout | null> {
  const layouts = await client.query("Layout", {
    where: { slug: { $eq: slug } },
    limit: 1,
  });

  return layouts[0] ?? null;
}

/**
 * Get the layout for content
 */
export async function getContentLayout(
  client: FlxblClient,
  contentId: string
): Promise<Layout | null> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "USES_LAYOUT",
    "out",
    "Layout"
  );

  return rels[0]?.target ?? null;
}

/**
 * Set the layout for content
 */
export async function setContentLayout(
  client: FlxblClient,
  contentId: string,
  layoutId: string
): Promise<void> {
  // Remove existing layout relationship
  const existingRels = await client.getRelationships(
    "Content",
    contentId,
    "USES_LAYOUT",
    "out",
    "Layout"
  );

  for (const rel of existingRels) {
    await client.deleteRelationship("Content", contentId, "USES_LAYOUT", rel.target.id);
  }

  // Create new layout relationship
  await client.createRelationship(
    "Content",
    contentId,
    "USES_LAYOUT",
    layoutId,
    {}
  );
}

// =============================================================================
// Placement Operations
// =============================================================================

interface PlacementWithContent {
  placement: LayoutPlacement;
  block?: Block;
  contentBlock?: ContentBlock;
}

/**
 * Get all placements for content
 */
export async function getContentPlacements(
  client: FlxblClient,
  contentId: string
): Promise<PlacementWithContent[]> {
  const placementRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_PLACEMENT",
    "out",
    "LayoutPlacement"
  );

  const placements: PlacementWithContent[] = [];

  for (const rel of placementRels) {
    const placement = rel.target;

    // Get block or content block
    const [blockRels, contentBlockRels] = await Promise.all([
      client.getRelationships(
        "LayoutPlacement",
        placement.id,
        "PLACEMENT_CONTAINS_BLOCK",
        "out",
        "Block"
      ),
      client.getRelationships(
        "LayoutPlacement",
        placement.id,
        "PLACEMENT_CONTAINS_CONTENT_BLOCK",
        "out",
        "ContentBlock"
      ),
    ]);

    placements.push({
      placement,
      block: blockRels[0]?.target,
      contentBlock: contentBlockRels[0]?.target,
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
 * Group placements by region
 */
export function groupPlacementsByRegion(
  placements: PlacementWithContent[]
): Map<string, PlacementWithContent[]> {
  const groups = new Map<string, PlacementWithContent[]>();

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
 * Create a placement for content
 */
export async function createPlacement(
  client: FlxblClient,
  contentId: string,
  region: string,
  position: number,
  blockId?: string,
  contentBlockId?: string
): Promise<LayoutPlacement> {
  // Create placement
  const placement = await client.create("LayoutPlacement", {
    region,
    position,
    settings: {},
  });

  // Link to content
  await client.createRelationship(
    "Content",
    contentId,
    "HAS_PLACEMENT",
    placement.id,
    { region, position }
  );

  // Link to block if provided
  if (blockId) {
    await client.createRelationship(
      "LayoutPlacement",
      placement.id,
      "PLACEMENT_CONTAINS_BLOCK",
      blockId,
      {}
    );
  }

  // Link to content block if provided
  if (contentBlockId) {
    await client.createRelationship(
      "LayoutPlacement",
      placement.id,
      "PLACEMENT_CONTAINS_CONTENT_BLOCK",
      contentBlockId,
      {}
    );
  }

  return placement;
}

/**
 * Delete a placement
 */
export async function deletePlacement(
  client: FlxblClient,
  contentId: string,
  placementId: string
): Promise<void> {
  // Remove relationships
  await client.deleteRelationship("Content", contentId, "HAS_PLACEMENT", placementId);

  // Delete placement
  await client.delete("LayoutPlacement", placementId);
}

/**
 * Update placement position
 */
export async function updatePlacementPosition(
  client: FlxblClient,
  placementId: string,
  position: number
): Promise<LayoutPlacement> {
  return client.patch("LayoutPlacement", placementId, { position });
}

// =============================================================================
// Global Block Operations
// =============================================================================

/**
 * Get all global blocks
 */
export async function getGlobalBlocks(
  client: FlxblClient
): Promise<Block[]> {
  return client.query("Block", {
    where: { isGlobal: { $eq: true } },
  });
}

/**
 * Get global blocks by type
 */
export async function getGlobalBlocksByType(
  client: FlxblClient,
  blockType: Block["blockType"]
): Promise<Block[]> {
  return client.query("Block", {
    where: {
      $and: [
        { isGlobal: { $eq: true } },
        { blockType: { $eq: blockType } },
      ],
    },
  });
}

// =============================================================================
// Layout Templates
// =============================================================================

/**
 * Layout template definitions for rendering
 */
export const LAYOUT_TEMPLATES = {
  "single-column": {
    template: "single-column",
    gridClass: "max-w-3xl mx-auto",
    regions: {
      main: { gridArea: "main", className: "col-span-full" },
    },
  },
  "two-column-sidebar": {
    template: "two-column-sidebar",
    gridClass: "grid lg:grid-cols-[1fr_300px] gap-8 max-w-6xl mx-auto",
    regions: {
      main: { gridArea: "main", className: "" },
      sidebar: { gridArea: "sidebar", className: "" },
    },
  },
  "full-width": {
    template: "full-width",
    gridClass: "w-full",
    regions: {
      hero: { gridArea: "hero", className: "w-full" },
      main: { gridArea: "main", className: "max-w-6xl mx-auto px-6" },
      footer: { gridArea: "footer", className: "max-w-6xl mx-auto px-6" },
    },
  },
} as const;

export type LayoutTemplate = keyof typeof LAYOUT_TEMPLATES;

