# Schema Reference

This document provides a comprehensive reference for the FLXBL graph database schema powering Kickass CMS. It covers all entities, their fields, relationships, and how they work together to deliver CMS functionality.

## Overview

Kickass CMS uses FLXBL, a graph database backend-as-a-service. The schema is designed around a content-first architecture with:

- **Core content entities** (Content, ContentBlock, Page, PageSection)
- **Taxonomy and organization** (Category, Author, WorkflowState)
- **Media and asset management** (Media, Block)
- **Layout and presentation** (Layout, LayoutPlacement)
- **Version control** (ContentRevision)

All entities share common system-managed fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | STRING | Unique identifier (auto-generated) |
| `tenantId` | STRING | Tenant isolation identifier |
| `createdAt` | DATETIME | Creation timestamp |
| `updatedAt` | DATETIME | Last modification timestamp |
| `isSystem` | BOOLEAN | Protects demo/system content from deletion |

---

## Entities

### Content

The primary entity for all publishable content items including blog posts, articles, and landing pages.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | STRING | Yes | Content title |
| `slug` | STRING | Yes | URL-safe identifier (unique per type) |
| `excerpt` | STRING | No | Short summary for listings |
| `contentType` | ENUM | Yes | `PAGE`, `POST`, or `ARTICLE` |
| `metadata` | JSON | No | Custom metadata (SEO, social, etc.) |
| `publishedAt` | DATETIME | No | Publication timestamp (null = unpublished) |
| `tags` | STRING_ARRAY | No | Flat taxonomy tags |

**Usage in CMS:**

- Posts appear at `/blog/[slug]`
- Articles appear at `/articles/[slug]`
- PAGE type content is embedded via the Page system
- `publishedAt` is set when transitioning to "published" workflow state
- Tags are comma-separated in the editor, stored as an array

```typescript
// Create content
const post = await client.create("Content", {
  title: "Getting Started",
  slug: "getting-started",
  contentType: "POST",
  excerpt: "Learn the basics of our platform",
  tags: ["tutorial", "beginner"],
});
```

---

### ContentBlock

Individual content blocks that compose the body of Content items. Supports structured block-based editing.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `blockType` | ENUM | Yes | Block type identifier |
| `content` | JSON | Yes | Block-specific content data |
| `position` | NUMBER | Yes | Order within parent content |
| `metadata` | JSON | No | Block settings and attributes |

**Block Types:**

| Type | Content Fields | Purpose |
|------|----------------|---------|
| `PARAGRAPH` | `text`, `format` | Rich text paragraph |
| `HEADING` | `text`, `level` (1-6) | Section headings |
| `IMAGE` | `src`, `alt`, `caption` | Inline images |
| `QUOTE` | `text`, `attribution` | Blockquotes |
| `CODE` | `code`, `language`, `filename` | Code snippets |
| `CALLOUT` | `text`, `variant`, `title` | Info/warning boxes |
| `LIST` | `items`, `ordered` | Bulleted or numbered lists |
| `DIVIDER` | `style` | Horizontal separators |
| `EMBED` | `url`, `contentId`, `displayStyle` | External embeds or content references |

**Usage in CMS:**

Content blocks are managed via the Tiptap editor and synced to FLXBL:

```typescript
import { saveContentBlocks, loadContentAsTiptap } from "@/lib/flxbl/blocks";

// Save editor content to blocks
await saveContentBlocks(client, contentId, tiptapDoc);

// Load blocks as Tiptap document
const doc = await loadContentAsTiptap(client, contentId);
```

---

### Author

Content creators with profile information for attribution.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | STRING | Yes | Display name |
| `email` | STRING | Yes | Email address (unique) |
| `bio` | STRING | No | Author biography |
| `avatarUrl` | STRING | No | Profile image URL |

**Usage in CMS:**

Authors are linked to content via the `AUTHORED_BY` relationship:

```typescript
// Get primary author for content
const { author, authorProps } = await getContentWithPrimaryAuthor(client, contentId);
// authorProps.role = "PRIMARY" | "CONTRIBUTOR" | "EDITOR"
```

---

### Category

Hierarchical content organization supporting nested categories.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | STRING | Yes | Category name |
| `slug` | STRING | Yes | URL-safe identifier |
| `description` | STRING | No | Category description |

**Hierarchy:**

Categories support parent-child relationships via `CATEGORY_PARENT`. Build category trees:

```typescript
// Get categories with hierarchy info
const categories = await client.list("Category");
const parentRels = await client.getRelationships(
  "Category", categoryId, "CATEGORY_PARENT", "out", "Category"
);
```

**Usage in CMS:**

- Category archives at `/category/[slug]`
- Content can belong to multiple categories
- Pages can filter content by category via `PAGE_FILTERS_CATEGORY`

---

### WorkflowState

Defines content lifecycle states and allowed transitions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | STRING | Yes | Display name |
| `slug` | STRING | Yes | Unique identifier |
| `color` | STRING | Yes | UI badge color |
| `description` | STRING | No | State description |
| `position` | NUMBER | Yes | Order in workflow |
| `allowedTransitions` | STRING_ARRAY | No | Valid next state slugs |

**Default Workflow:**

```
draft (1) → in-review (2) → published (3)
                           ↓
                       archived (4)
```

**Usage in CMS:**

```typescript
import { transitionState, validateTransition } from "@/lib/flxbl/workflow";

// Validate before transitioning
const validation = validateTransition("draft", "published", states);
if (!validation.valid) {
  console.error(validation.reason);
}

// Perform transition
await transitionState(client, contentId, publishedStateId, "admin");
```

---

### Media

Uploaded media files including images, documents, and videos.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | STRING | Yes | Original filename |
| `url` | STRING | Yes | Storage URL |
| `mimeType` | STRING | Yes | MIME type (e.g., `image/jpeg`) |
| `size` | NUMBER | Yes | File size in bytes |
| `alt` | STRING | No | Alt text for accessibility |
| `caption` | STRING | No | Display caption |

**Usage in CMS:**

Media is attached to content via `HAS_MEDIA` with role metadata:

```typescript
// Attach featured image
await client.createRelationship(
  "Content", contentId, "HAS_MEDIA", mediaId,
  { role: "FEATURED", position: 0 }
);
```

---

### Page

CMS pages with custom URL paths and section-based layouts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | STRING | Yes | Page title |
| `slug` | STRING | Yes | URL segment |
| `path` | STRING | Yes | Full URL path (e.g., `/about`) |
| `description` | STRING | No | SEO description |
| `isPublished` | BOOLEAN | Yes | Publication status |
| `showInNav` | BOOLEAN | Yes | Include in navigation |
| `navOrder` | NUMBER | No | Navigation sort order |
| `metadata` | JSON | No | SEO and custom metadata |

**Hierarchy:**

Pages support parent-child via `PAGE_PARENT`:

```
Services (/services)
├── Consulting (/services/consulting)
└── Support (/services/support)
```

**Usage in CMS:**

```typescript
// Get page tree
const pages = await getPageTree(client);

// Get page by path
const page = await getPageByPath(client, "/services/consulting");
```

---

### PageSection

Modular content sections within pages.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | STRING | Yes | Section name |
| `sectionType` | ENUM | Yes | Section type |
| `config` | JSON | No | Section configuration |
| `position` | NUMBER | Yes | Order on page |

**Section Types:**

| Type | Config Fields | Purpose |
|------|---------------|---------|
| `CONTENT_LIST` | `limit`, `contentType`, `orderBy`, `orderDirection` | Display grid of content items |
| `SINGLE_CONTENT` | `contentId` | Embed specific content item |
| `STATIC_BLOCK` | `html`, `css` | Custom HTML content |
| `GLOBAL_BLOCK` | `blockId` | Reference to reusable Block |

**Content List Config:**

```json
{
  "limit": 6,
  "contentType": "POST",
  "orderBy": "publishedAt",
  "orderDirection": "DESC"
}
```

---

### Layout

Reusable layout templates defining content regions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | STRING | Yes | Layout name |
| `slug` | STRING | Yes | Unique identifier |
| `description` | STRING | No | Layout description |
| `regions` | JSON | Yes | Region definitions |
| `template` | STRING | Yes | Template identifier |

**Regions:**

Layouts define named regions where content can be placed:

```json
{
  "header": { "type": "single" },
  "main": { "type": "blocks" },
  "sidebar": { "type": "blocks" },
  "footer": { "type": "single" }
}
```

---

### LayoutPlacement

Content placement within layout regions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `region` | STRING | Yes | Target region name |
| `position` | NUMBER | Yes | Order within region |
| `settings` | JSON | No | Placement-specific settings |

---

### Block

Reusable global blocks (widgets, CTAs, etc.).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | STRING | Yes | Block name |
| `blockType` | ENUM | Yes | Block type |
| `content` | JSON | Yes | Block content data |
| `isGlobal` | BOOLEAN | Yes | Global availability |

**Block Types:**

| Type | Purpose |
|------|---------|
| `AUTHOR_BIO` | Author profile card |
| `RELATED_POSTS` | Related content grid |
| `NEWSLETTER` | Newsletter signup form |
| `CTA` | Call-to-action banner |
| `CUSTOM` | Custom HTML/component |

---

### ContentRevision

Version history snapshots for content.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `revisionNumber` | NUMBER | Yes | Sequential revision number |
| `title` | STRING | Yes | Title at time of revision |
| `blocksSnapshot` | JSON | Yes | Complete blocks snapshot |
| `changeMessage` | STRING | No | Commit message |
| `isCurrent` | BOOLEAN | Yes | Whether this is the active version |

**Usage in CMS:**

```typescript
import { createRevision, restoreRevision } from "@/lib/flxbl/revisions";

// Create revision on save
await createRevision(client, contentId, authorId, "Updated introduction");

// Restore previous version
await restoreRevision(client, contentId, revisionId, authorId);
// Creates new revision with message "Restored from revision #N"
```

---

## Relationships

Relationships connect entities in the graph and can carry their own properties.

### Content Relationships

#### AUTHORED_BY

Links content to its author(s).

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | Many-to-Many |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | ENUM | Yes | `PRIMARY`, `CONTRIBUTOR`, or `EDITOR` |
| `byline` | STRING | No | Custom author byline |

**Usage:**

```typescript
// Create primary author relationship
await client.createRelationship(
  "Content", contentId, "AUTHORED_BY", authorId,
  { role: "PRIMARY", byline: "Technology Editor" }
);

// Query content with primary author
const authorRels = await client.getRelationships(
  "Content", contentId, "AUTHORED_BY", "out", "Author"
);
const primary = authorRels.find(r => r.relationship.properties.role === "PRIMARY");
```

---

#### CATEGORIZED_AS

Links content to categories.

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | Many-to-Many |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `featured` | BOOLEAN | No | Featured in category |
| `position` | NUMBER | No | Order within category |

---

#### HAS_MEDIA

Attaches media files to content.

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | Many-to-Many |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | ENUM | Yes | `FEATURED`, `GALLERY`, `INLINE`, or `ATTACHMENT` |
| `position` | NUMBER | No | Order for galleries |
| `caption` | STRING | No | Override media caption |

---

#### HAS_BLOCK

Connects content to its content blocks.

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | One-to-Many |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `position` | NUMBER | Yes | Block order |

---

#### HAS_STATE

Assigns workflow state to content.

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | One-to-One |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assignedAt` | DATETIME | Yes | State transition timestamp |
| `assignedBy` | STRING | No | User who made the transition |

---

#### HAS_REVISION

Links content to its version history.

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | One-to-Many |

No additional properties.

---

#### USES_LAYOUT

Assigns layout template to content.

| Direction | Source → Target |
|-----------|-----------------|
| Cardinality | Many-to-One |

No additional properties.

---

### Page Relationships

#### PAGE_PARENT

Creates page hierarchy.

| Direction | Child → Parent |
|-----------|-----------------|
| Cardinality | Many-to-One |

No additional properties.

---

#### PAGE_HAS_SECTION

Links pages to their sections.

| Direction | Page → PageSection |
|-----------|-----------------|
| Cardinality | One-to-Many |

No additional properties.

---

#### PAGE_FILTERS_CATEGORY

Applies category filter to page content.

| Direction | Page → Category |
|-----------|-----------------|
| Cardinality | Many-to-Many |

No additional properties. All content lists on the page filter by linked categories.

---

#### PAGE_USES_LAYOUT

Assigns layout to page.

| Direction | Page → Layout |
|-----------|-----------------|
| Cardinality | Many-to-One |

No additional properties.

---

### Section Relationships

#### SECTION_HAS_CONTENT

Links sections to embedded content.

| Direction | PageSection → Content |
|-----------|-----------------|
| Cardinality | Many-to-Many |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `position` | NUMBER | No | Order within section |

---

#### SECTION_HAS_BLOCK

Links sections to global blocks.

| Direction | PageSection → Block |
|-----------|-----------------|
| Cardinality | Many-to-One |

No additional properties.

---

### Workflow Relationships

#### STATE_TRANSITION

Defines allowed workflow transitions.

| Direction | FromState → ToState |
|-----------|-----------------|
| Cardinality | Many-to-Many |

**Properties:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requiresApproval` | BOOLEAN | No | Needs approval to transition |
| `notifyRoles` | STRING_ARRAY | No | Roles to notify on transition |

---

### Revision Relationships

#### REVISION_CREATED_BY

Links revision to author who created it.

| Direction | ContentRevision → Author |
|-----------|-----------------|
| Cardinality | Many-to-One |

No additional properties.

---

### Block Reference Relationships

#### BLOCK_REFERENCES_MEDIA

Links content blocks to media (e.g., IMAGE blocks).

| Direction | ContentBlock → Media |
|-----------|-----------------|
| Cardinality | Many-to-One |

---

#### BLOCK_REFERENCES_CONTENT

Links EMBED blocks to embedded content.

| Direction | ContentBlock → Content |
|-----------|-----------------|
| Cardinality | Many-to-One |

---

#### BLOCK_REFERENCES_AUTHOR

Links blocks to authors (e.g., for quotes).

| Direction | ContentBlock → Author |
|-----------|-----------------|
| Cardinality | Many-to-One |

---

## API Operations

### Basic CRUD

Every entity supports standard operations:

```typescript
// List with pagination
const { data, pagination } = await client.list("Content", {
  limit: 20,
  offset: 0,
  orderBy: "createdAt",
  orderDirection: "DESC"
});

// Get by ID
const content = await client.get("Content", id);

// Create
const newContent = await client.create("Content", { ... });

// Update (full)
const updated = await client.update("Content", id, { ... });

// Partial update
const patched = await client.patch("Content", id, { title: "New Title" });

// Delete
await client.delete("Content", id);
```

### Query DSL

Advanced filtering with operators:

```typescript
const results = await client.query("Content", {
  where: {
    contentType: { $eq: "POST" },
    publishedAt: { $gte: new Date("2024-01-01") },
    tags: { $contains: "featured" }
  },
  orderBy: "publishedAt",
  orderDirection: "DESC",
  limit: 10
});
```

**Available Operators:**

| Operator | Description |
|----------|-------------|
| `$eq` | Equals |
| `$ne` | Not equals |
| `$gt` | Greater than |
| `$gte` | Greater than or equal |
| `$lt` | Less than |
| `$lte` | Less than or equal |
| `$in` | In array |
| `$nin` | Not in array |
| `$contains` | Array contains value |
| `$startsWith` | String starts with |
| `$endsWith` | String ends with |

### Graph Traversal

Query across relationships:

```typescript
// Find content with specific author role
const results = await client.query("Content", {
  traverse: [{
    relationship: "AUTHORED_BY",
    direction: "out",
    where: { role: { $eq: "PRIMARY" } },
    include: true
  }],
  limit: 10
});
```

### Relationship Operations

```typescript
// Create relationship
await client.createRelationship(
  "Content", contentId,
  "AUTHORED_BY", authorId,
  { role: "PRIMARY" }
);

// Get relationships
const rels = await client.getRelationships(
  "Content", contentId,
  "AUTHORED_BY", "out", "Author"
);

// Update relationship properties
await client.updateRelationship(
  "Content", contentId,
  "AUTHORED_BY", authorId,
  { byline: "Updated byline" }
);

// Delete relationship
await client.deleteRelationship(
  "Content", contentId,
  "AUTHORED_BY", authorId
);
```

---

## Schema Version

| Property | Value |
|----------|-------|
| API Version | 1.5.0 |
| Description | Add isSystem boolean field to all entities for demo content protection |

---

## Related Documentation

- [Content Management](content-management.md) - User guide for content operations
- [Revision System](revision-system.md) - Version history and restoration
- [Page System](page-system.md) - Pages, sections, and layouts
- [Developer Guide](developer-guide.md) - Client library and API patterns

