/**
 * Content Revision System
 * 
 * Manages version history for content items
 */

import type { FlxblClient } from "./client";
import type { ContentRevision, ContentBlock, CreateContentRevision } from "./types";
import { loadContentBlocks } from "./blocks";

// =============================================================================
// Revision Operations
// =============================================================================

/**
 * Create a new revision for content
 */
export async function createRevision(
  client: FlxblClient,
  contentId: string,
  authorId: string,
  changeMessage?: string
): Promise<ContentRevision> {
  // Get content
  const content = await client.get("Content", contentId);

  // Get current blocks
  const blocks = await loadContentBlocks(client, contentId);

  // Get existing revisions to determine revision number
  const existingRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_REVISION",
    "out",
    "ContentRevision"
  );

  // Mark all existing revisions as not current
  for (const rel of existingRels) {
    if (rel.target.isCurrent) {
      await client.patch("ContentRevision", rel.target.id, { isCurrent: false });
    }
  }

  // Calculate next revision number
  const maxRevision = existingRels.reduce(
    (max, rel) => Math.max(max, rel.target.revisionNumber),
    0
  );

  // Create new revision - blocksSnapshot is an object with position as keys
  const blocksObj: Record<string, unknown> = {};
  for (const b of blocks) {
    blocksObj[String(b.position)] = {
      blockType: b.blockType,
      content: b.content,
      metadata: b.metadata,
    };
  }

  const revisionData: CreateContentRevision = {
    revisionNumber: maxRevision + 1,
    title: content.title,
    blocksSnapshot: blocksObj,
    changeMessage: changeMessage ?? null,
    isCurrent: true,
  };

  const revision = await client.create("ContentRevision", revisionData);

  // Create relationships
  await client.createRelationship(
    "Content",
    contentId,
    "HAS_REVISION",
    revision.id,
    {}
  );

  if (authorId) {
    await client.createRelationship(
      "ContentRevision",
      revision.id,
      "REVISION_CREATED_BY",
      authorId,
      {}
    );
  }

  return revision;
}

/**
 * Get all revisions for content
 */
export async function getRevisions(
  client: FlxblClient,
  contentId: string
): Promise<ContentRevision[]> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_REVISION",
    "out",
    "ContentRevision"
  );

  return rels
    .map((r) => r.target)
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}

/**
 * Get a specific revision
 */
export async function getRevision(
  client: FlxblClient,
  revisionId: string
): Promise<ContentRevision> {
  return client.get("ContentRevision", revisionId);
}

/**
 * Get the current (active) revision for content
 */
export async function getCurrentRevision(
  client: FlxblClient,
  contentId: string
): Promise<ContentRevision | null> {
  const revisions = await getRevisions(client, contentId);
  return revisions.find((r) => r.isCurrent) ?? null;
}

/**
 * Get revision author
 */
export async function getRevisionAuthor(
  client: FlxblClient,
  revisionId: string
) {
  const rels = await client.getRelationships(
    "ContentRevision",
    revisionId,
    "REVISION_CREATED_BY",
    "out",
    "Author"
  );

  return rels[0]?.target ?? null;
}

/**
 * Restore a revision (make it current and update content)
 */
export async function restoreRevision(
  client: FlxblClient,
  contentId: string,
  revisionId: string,
  authorId: string
): Promise<ContentRevision> {
  // Get the revision to restore
  const revision = await client.get("ContentRevision", revisionId);

  // Get existing revisions
  const existingRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_REVISION",
    "out",
    "ContentRevision"
  );

  // Mark all existing revisions as not current
  for (const rel of existingRels) {
    if (rel.target.isCurrent) {
      await client.patch("ContentRevision", rel.target.id, { isCurrent: false });
    }
  }

  // Delete existing blocks
  const blockRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_BLOCK",
    "out",
    "ContentBlock"
  );

  for (const rel of blockRels) {
    await client.deleteRelationship("Content", contentId, "HAS_BLOCK", rel.target.id);
    await client.delete("ContentBlock", rel.target.id);
  }

  // Recreate blocks from snapshot (object format with positions as keys)
  const blocksSnapshot = revision.blocksSnapshot as Record<string, {
    blockType: string;
    content: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>;

  const positions = Object.keys(blocksSnapshot).map(Number).sort((a, b) => a - b);

  for (const position of positions) {
    const blockData = blocksSnapshot[String(position)];
    const block = await client.create("ContentBlock", {
      blockType: blockData.blockType as ContentBlock["blockType"],
      content: blockData.content,
      position,
      metadata: blockData.metadata ?? {},
    });

    await client.createRelationship(
      "Content",
      contentId,
      "HAS_BLOCK",
      block.id,
      { position }
    );
  }

  // Update content title if changed
  await client.patch("Content", contentId, { title: revision.title });

  // Create a new revision recording this restore
  return createRevision(
    client,
    contentId,
    authorId,
    `Restored from revision #${revision.revisionNumber}`
  );
}

/**
 * Compare two revisions and return differences
 */
export function compareRevisions(
  revision1: ContentRevision,
  revision2: ContentRevision
): {
  titleChanged: boolean;
  blocksAdded: number;
  blocksRemoved: number;
  blocksModified: number;
} {
  // blocksSnapshot is now an object with position keys
  const snapshot1 = (revision1.blocksSnapshot ?? {}) as Record<string, { content: unknown }>;
  const snapshot2 = (revision2.blocksSnapshot ?? {}) as Record<string, { content: unknown }>;

  const titleChanged = revision1.title !== revision2.title;
  
  // Simple comparison based on position and content
  const map1 = new Map<string, string>();
  const map2 = new Map<string, string>();

  for (const [pos, block] of Object.entries(snapshot1)) {
    map1.set(pos, JSON.stringify(block.content));
  }

  for (const [pos, block] of Object.entries(snapshot2)) {
    map2.set(pos, JSON.stringify(block.content));
  }

  let blocksAdded = 0;
  let blocksRemoved = 0;
  let blocksModified = 0;

  // Check blocks in revision2 that aren't in revision1
  for (const [pos, content] of map2) {
    if (!map1.has(pos)) {
      blocksAdded++;
    } else if (map1.get(pos) !== content) {
      blocksModified++;
    }
  }

  // Check blocks in revision1 that aren't in revision2
  for (const pos of map1.keys()) {
    if (!map2.has(pos)) {
      blocksRemoved++;
    }
  }

  return {
    titleChanged,
    blocksAdded,
    blocksRemoved,
    blocksModified,
  };
}

