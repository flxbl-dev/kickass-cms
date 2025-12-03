import type {
  FlxblClient,
  QueryOptions,
  QueryWhere,
  QueryTraversal,
} from "./client";
import type {
  Content,
  Author,
  Category,
  Media,
  ContentBlock,
  WorkflowState,
  ContentRevision,
  Layout,
  AuthorRole,
  MediaRole,
  AuthoredByProps,
  HasMediaProps,
  HasBlockProps,
  HasStateProps,
  ContentWithRelations,
  CategoryWithRelations,
} from "./types";

// =============================================================================
// Query Builder Helpers
// =============================================================================

/**
 * Build a where clause for content by slug
 */
export function whereSlug(slug: string): QueryWhere {
  return { slug: { $eq: slug } };
}

/**
 * Build a where clause for content containing a tag
 */
export function whereHasTag(tag: string): QueryWhere {
  return { tags: { $contains: tag } };
}

/**
 * Build a where clause for content type
 */
export function whereContentType(contentType: Content["contentType"]): QueryWhere {
  return { contentType: { $eq: contentType } };
}

/**
 * Build a traversal to get authors with optional role filter
 */
export function traverseAuthors(role?: AuthorRole): QueryTraversal {
  return {
    relationship: "AUTHORED_BY",
    direction: "out",
    ...(role && { where: { role: { $eq: role } } }),
  };
}

/**
 * Build a traversal to get media with optional role filter
 */
export function traverseMedia(role?: MediaRole): QueryTraversal {
  return {
    relationship: "HAS_MEDIA",
    direction: "out",
    ...(role && { where: { role: { $eq: role } } }),
  };
}

/**
 * Build a traversal to get categories with optional featured filter
 */
export function traverseCategories(featuredOnly?: boolean): QueryTraversal {
  return {
    relationship: "CATEGORIZED_AS",
    direction: "out",
    ...(featuredOnly && { where: { featured: { $eq: true } } }),
  };
}

/**
 * Build a traversal to get content blocks
 */
export function traverseBlocks(): QueryTraversal {
  return {
    relationship: "HAS_BLOCK",
    direction: "out",
  };
}

/**
 * Build a traversal to get workflow state
 */
export function traverseState(): QueryTraversal {
  return {
    relationship: "HAS_STATE",
    direction: "out",
  };
}

// =============================================================================
// Workflow State Helpers
// =============================================================================

/**
 * Get content by workflow state slug
 */
export async function getContentByState(
  client: FlxblClient,
  stateSlug: string,
  options?: { limit?: number; offset?: number },
): Promise<Content[]> {
  // First find the state
  const states = await client.query("WorkflowState", {
    where: whereSlug(stateSlug),
    limit: 1,
  });

  if (states.length === 0) return [];

  // Get content with this state via relationship query
  const stateId = states[0].id;
  const stateRels = await client.getRelationships(
    "WorkflowState",
    stateId,
    "HAS_STATE",
    "in",
    "Content",
  );

  // Return the content items
  return stateRels.map((r) => r.target);
}

/**
 * Get published content (state slug = 'published')
 * Deduplicates by slug, keeping only the most recently updated version
 */
export async function getPublishedContent(
  client: FlxblClient,
  options?: { limit?: number; offset?: number },
): Promise<Content[]> {
  const allPublished = await getContentByState(client, "published", options);
  
  // Deduplicate by slug, keeping the most recently updated version
  const slugMap = new Map<string, Content>();
  
  for (const content of allPublished) {
    const existing = slugMap.get(content.slug);
    if (!existing || content.updatedAt > existing.updatedAt) {
      slugMap.set(content.slug, content);
    }
  }
  
  // Convert back to array and sort by updatedAt descending
  return Array.from(slugMap.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

/**
 * Get draft content
 */
export async function getDraftContent(
  client: FlxblClient,
  options?: { limit?: number; offset?: number },
): Promise<Content[]> {
  return getContentByState(client, "draft", options);
}

/**
 * Get all workflow states in order
 */
export async function getWorkflowStates(
  client: FlxblClient,
): Promise<WorkflowState[]> {
  return client.list("WorkflowState", {
    orderBy: "position",
    orderDirection: "ASC",
  });
}

/**
 * Get the current state for content
 */
export async function getContentState(
  client: FlxblClient,
  contentId: string,
): Promise<{ state: WorkflowState; props: HasStateProps } | null> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_STATE",
    "out",
    "WorkflowState",
  );

  if (rels.length === 0) return null;

  return {
    state: rels[0].target,
    props: rels[0].relationship.properties,
  };
}

// =============================================================================
// Content Block Helpers
// =============================================================================

/**
 * Get all blocks for content, sorted by position
 */
export async function getContentBlocks(
  client: FlxblClient,
  contentId: string,
): Promise<Array<{ block: ContentBlock; position: number }>> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_BLOCK",
    "out",
    "ContentBlock",
  );

  return rels
    .sort((a, b) => {
      const posA = a.relationship.properties.position;
      const posB = b.relationship.properties.position;
      return posA - posB;
    })
    .map((r) => ({
      block: r.target,
      position: r.relationship.properties.position,
    }));
}

/**
 * Get media referenced by a content block
 */
export async function getBlockMedia(
  client: FlxblClient,
  blockId: string,
): Promise<Media | null> {
  const rels = await client.getRelationships(
    "ContentBlock",
    blockId,
    "BLOCK_REFERENCES_MEDIA",
    "out",
    "Media",
  );

  return rels[0]?.target ?? null;
}

/**
 * Get author referenced by a quote block
 */
export async function getBlockAuthor(
  client: FlxblClient,
  blockId: string,
): Promise<Author | null> {
  const rels = await client.getRelationships(
    "ContentBlock",
    blockId,
    "BLOCK_REFERENCES_AUTHOR",
    "out",
    "Author",
  );

  return rels[0]?.target ?? null;
}

/**
 * Get embedded content referenced by an embed block
 */
export async function getBlockEmbeddedContent(
  client: FlxblClient,
  blockId: string,
): Promise<Content | null> {
  const rels = await client.getRelationships(
    "ContentBlock",
    blockId,
    "BLOCK_REFERENCES_CONTENT",
    "out",
    "Content",
  );

  return rels[0]?.target ?? null;
}

// =============================================================================
// Revision Helpers
// =============================================================================

/**
 * Get all revisions for content, newest first
 */
export async function getContentRevisions(
  client: FlxblClient,
  contentId: string,
): Promise<ContentRevision[]> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_REVISION",
    "out",
    "ContentRevision",
  );

  return rels
    .map((r) => r.target)
    .sort((a, b) => b.revisionNumber - a.revisionNumber);
}

/**
 * Get the current (active) revision for content
 */
export async function getCurrentRevision(
  client: FlxblClient,
  contentId: string,
): Promise<ContentRevision | null> {
  const revisions = await getContentRevisions(client, contentId);
  return revisions.find((r) => r.isCurrent) ?? null;
}

/**
 * Get author who created a revision
 */
export async function getRevisionAuthor(
  client: FlxblClient,
  revisionId: string,
): Promise<Author | null> {
  const rels = await client.getRelationships(
    "ContentRevision",
    revisionId,
    "REVISION_CREATED_BY",
    "out",
    "Author",
  );

  return rels[0]?.target ?? null;
}

// =============================================================================
// Layout Helpers
// =============================================================================

/**
 * Get all available layouts
 */
export async function getLayouts(
  client: FlxblClient,
): Promise<Layout[]> {
  return client.list("Layout");
}

/**
 * Get the layout used by content
 */
export async function getContentLayout(
  client: FlxblClient,
  contentId: string,
): Promise<Layout | null> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "USES_LAYOUT",
    "out",
    "Layout",
  );

  return rels[0]?.target ?? null;
}

// =============================================================================
// Common CMS Query Functions
// =============================================================================

/**
 * Get content by slug (typically one result)
 */
export async function getContentBySlug(
  client: FlxblClient,
  slug: string,
): Promise<Content | null> {
  const results = await client.query("Content", {
    where: whereSlug(slug),
    limit: 1,
  });
  return results[0] ?? null;
}

/**
 * Get content with its primary author
 */
export async function getContentWithPrimaryAuthor(
  client: FlxblClient,
  contentId: string,
): Promise<{ content: Content; author: Author | null; authorProps: AuthoredByProps | null }> {
  const content = await client.get("Content", contentId);
  const authorRels = await client.getRelationships(
    "Content",
    contentId,
    "AUTHORED_BY",
    "out",
    "Author",
  );

  // Find primary author
  const primaryRel = authorRels.find(
    (r) => r.relationship.properties.role === "PRIMARY",
  );

  return {
    content,
    author: primaryRel?.target ?? null,
    authorProps: primaryRel?.relationship.properties ?? null,
  };
}

/**
 * Get content with its featured image
 */
export async function getContentWithFeaturedImage(
  client: FlxblClient,
  contentId: string,
): Promise<{ content: Content; featuredImage: Media | null; mediaProps: HasMediaProps | null }> {
  const content = await client.get("Content", contentId);
  const mediaRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_MEDIA",
    "out",
    "Media",
  );

  // Find featured image
  const featuredRel = mediaRels.find(
    (r) => r.relationship.properties.role === "FEATURED",
  );

  return {
    content,
    featuredImage: featuredRel?.target ?? null,
    mediaProps: featuredRel?.relationship.properties ?? null,
  };
}

/**
 * Get all authors for a piece of content
 */
export async function getContentAuthors(
  client: FlxblClient,
  contentId: string,
): Promise<Array<{ author: Author; role: AuthorRole; byline?: string | null }>> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "AUTHORED_BY",
    "out",
    "Author",
  );

  return rels.map((r) => ({
    author: r.target,
    role: r.relationship.properties.role,
    byline: r.relationship.properties.byline,
  }));
}

/**
 * Get all media for content, sorted by position
 */
export async function getContentMedia(
  client: FlxblClient,
  contentId: string,
  role?: MediaRole,
): Promise<Array<{ media: Media; role: MediaRole; position?: number | null; caption?: string | null }>> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_MEDIA",
    "out",
    "Media",
  );

  let filtered = rels;
  if (role) {
    filtered = rels.filter((r) => r.relationship.properties.role === role);
  }

  // Sort by position
  return filtered
    .sort((a, b) => {
      const posA = a.relationship.properties.position ?? Infinity;
      const posB = b.relationship.properties.position ?? Infinity;
      return posA - posB;
    })
    .map((r) => ({
      media: r.target,
      role: r.relationship.properties.role,
      position: r.relationship.properties.position,
      caption: r.relationship.properties.caption,
    }));
}

/**
 * Get all categories for content
 */
export async function getContentCategories(
  client: FlxblClient,
  contentId: string,
): Promise<Array<{ category: Category; featured?: boolean | null; position?: number | null }>> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "CATEGORIZED_AS",
    "out",
    "Category",
  );

  return rels.map((r) => ({
    category: r.target,
    featured: r.relationship.properties.featured,
    position: r.relationship.properties.position,
  }));
}

/**
 * Search content by tags
 */
export async function searchContentByTag(
  client: FlxblClient,
  tag: string,
  options?: { limit?: number },
): Promise<Content[]> {
  return client.query("Content", {
    where: whereHasTag(tag),
    orderBy: "updatedAt",
    orderDirection: "DESC",
    limit: options?.limit,
  });
}

/**
 * Get content with all its relations (for full page rendering)
 */
export async function getContentWithRelations(
  client: FlxblClient,
  contentId: string,
): Promise<ContentWithRelations | null> {
  try {
    const content = await client.get("Content", contentId);

    const [authorRels, mediaRels, categoryRels, blockRels, stateRels, layoutRels] =
      await Promise.all([
        client.getRelationships("Content", contentId, "AUTHORED_BY", "out", "Author"),
        client.getRelationships("Content", contentId, "HAS_MEDIA", "out", "Media"),
        client.getRelationships("Content", contentId, "CATEGORIZED_AS", "out", "Category"),
        client.getRelationships("Content", contentId, "HAS_BLOCK", "out", "ContentBlock"),
        client.getRelationships("Content", contentId, "HAS_STATE", "out", "WorkflowState"),
        client.getRelationships("Content", contentId, "USES_LAYOUT", "out", "Layout"),
      ]);

    return {
      ...content,
      _relationships: {
        AUTHORED_BY: authorRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        HAS_MEDIA: mediaRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        CATEGORIZED_AS: categoryRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        HAS_BLOCK: blockRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        HAS_STATE: stateRels.map((r) => ({
          target: r.target,
          properties: r.relationship.properties,
        })),
        USES_LAYOUT: layoutRels.map((r) => ({
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
 * List all content with basic info for admin tables
 */
export async function listAllContent(
  client: FlxblClient,
  options?: { limit?: number; offset?: number; orderBy?: string; orderDirection?: "ASC" | "DESC" },
): Promise<Content[]> {
  return client.list("Content", {
    orderBy: options?.orderBy ?? "updatedAt",
    orderDirection: options?.orderDirection ?? "DESC",
    limit: options?.limit,
    offset: options?.offset,
  });
}

// =============================================================================
// Category Hierarchy Helpers (using CATEGORY_PARENT relationship)
// =============================================================================

/**
 * Get the parent category using CATEGORY_PARENT relationship
 * Returns null if the parent doesn't exist (handles orphaned relationships)
 */
export async function getCategoryParent(
  client: FlxblClient,
  categoryId: string,
): Promise<Category | null> {
  try {
    const rels = await client.getRelationships(
      "Category",
      categoryId,
      "CATEGORY_PARENT",
      "out",
      "Category",
    );
    return rels[0]?.target ?? null;
  } catch (error) {
    // Handle case where relationship points to a deleted entity
    console.warn(`Failed to get parent for category ${categoryId}:`, error);
    return null;
  }
}

/**
 * Get child categories using CATEGORY_PARENT relationship
 */
export async function getCategoryChildren(
  client: FlxblClient,
  categoryId: string,
): Promise<Category[]> {
  const rels = await client.getRelationships(
    "Category",
    categoryId,
    "CATEGORY_PARENT",
    "in",
    "Category",
  );
  return rels.map((r) => r.target);
}

/**
 * Get root categories (categories without a parent)
 */
export async function getRootCategories(
  client: FlxblClient,
): Promise<Category[]> {
  const allCategories = await client.list("Category");
  const rootCategories: Category[] = [];

  for (const category of allCategories) {
    const parent = await getCategoryParent(client, category.id);
    if (!parent) {
      rootCategories.push(category);
    }
  }

  return rootCategories;
}

/**
 * Set the parent category using CATEGORY_PARENT relationship
 */
export async function setCategoryParent(
  client: FlxblClient,
  categoryId: string,
  parentId: string | null,
): Promise<void> {
  // Remove existing parent relationship
  const existingParent = await getCategoryParent(client, categoryId);
  if (existingParent) {
    await client.deleteRelationship(
      "Category",
      categoryId,
      "CATEGORY_PARENT",
      existingParent.id,
    );
  }

  // Create new relationship if parentId provided
  if (parentId) {
    await client.createRelationship(
      "Category",
      categoryId,
      "CATEGORY_PARENT",
      parentId,
      {},
    );
  }
}

/**
 * Category tree node for building hierarchies
 */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

/**
 * Build a category tree from flat list using relationships
 */
export async function getCategoryTree(
  client: FlxblClient,
): Promise<CategoryTreeNode[]> {
  const allCategories = await client.list("Category");

  // Build parent map using relationships
  const parentMap = new Map<string, string>();
  for (const category of allCategories) {
    const parent = await getCategoryParent(client, category.id);
    if (parent) {
      parentMap.set(category.id, parent.id);
    }
  }

  // Build tree
  const categoryMap = new Map<string, CategoryTreeNode>();
  for (const category of allCategories) {
    categoryMap.set(category.id, { ...category, children: [] });
  }

  const rootNodes: CategoryTreeNode[] = [];
  for (const category of allCategories) {
    const node = categoryMap.get(category.id)!;
    const parentId = parentMap.get(category.id);

    if (parentId && categoryMap.has(parentId)) {
      categoryMap.get(parentId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

/**
 * Get all categories with their parent info for admin UI
 */
export async function getAllCategoriesWithParent(
  client: FlxblClient,
): Promise<Array<Category & { parentId: string | null }>> {
  const allCategories = await client.list("Category");
  const result: Array<Category & { parentId: string | null }> = [];

  for (const category of allCategories) {
    const parent = await getCategoryParent(client, category.id);
    result.push({
      ...category,
      parentId: parent?.id ?? null,
    });
  }

  return result;
}

// =============================================================================
// Published Content by Slug and Type (for content routes)
// =============================================================================

/**
 * Get published content by slug and content type
 * Verifies content is in "published" workflow state
 */
export async function getPublishedContentBySlugAndType(
  client: FlxblClient,
  slug: string,
  contentType: "ARTICLE" | "POST",
): Promise<ContentWithRelations | null> {
  // Find content by slug and type
  const results = await client.query("Content", {
    where: {
      slug: { $eq: slug },
      contentType: { $eq: contentType },
    },
    limit: 1,
  });

  if (results.length === 0) return null;

  const content = results[0];

  // Verify content is in published state
  const stateRels = await client.getRelationships(
    "Content",
    content.id,
    "HAS_STATE",
    "out",
    "WorkflowState",
  );

  const currentState = stateRels[0]?.target;
  if (!currentState || currentState.slug !== "published") {
    return null;
  }

  // Get all relations for full rendering
  return getContentWithRelations(client, content.id);
}
