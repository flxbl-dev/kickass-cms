# Content Management

This guide covers creating and managing content in Kickass CMS, including content types, workflow states, and relationships.

## Content Types

The CMS supports three distinct content types, each designed for different use cases:

| Type | URL Pattern | Use Case |
|------|-------------|----------|
| **Post** | `/blog/[slug]` | Blog posts, news updates, chronological feeds |
| **Article** | `/articles/[slug]` | Long-form content, tutorials, evergreen pieces |
| **Landing Content** | Via Page system | Marketing pages, static content (no author/categories) |

### Choosing the Right Type

- **Post**: Time-sensitive content that appears in reverse chronological order. Best for news, updates, and regular blog content.
- **Article**: Structured, authoritative content that may be updated over time. Ideal for documentation, guides, and reference material.
- **Landing Content**: Static content without author attribution, displayed through the [Page System](page-system.md).

## Creating Content

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Content title (displayed in lists and as page title) |
| `slug` | string | URL-safe identifier (auto-generated from title if not provided) |
| `contentType` | enum | One of: `POST`, `ARTICLE`, `PAGE` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `excerpt` | string | Short summary for content cards and SEO |
| `tags` | string[] | Comma-separated tags for filtering and archives |
| `metadata` | object | Custom key-value pairs for advanced use cases |

## Workflow States

Content progresses through a defined workflow pipeline:

```
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  Draft  │ → │ In Review │ → │ Approved │ → │ Published │
└─────────┘    └───────────┘    └──────────┘    └───────────┘
                                                      │
                                                      ↓
                                               ┌──────────┐
                                               │ Archived │
                                               └──────────┘
```

### State Descriptions

| State | Description | Public Visibility |
|-------|-------------|-------------------|
| **Draft** | Initial state for new content. Work in progress. | Hidden |
| **In Review** | Submitted for editorial review and approval. | Hidden |
| **Approved** | Reviewed and ready for publication. | Hidden |
| **Published** | Live on the public site with `publishedAt` timestamp. | Visible |
| **Archived** | Removed from public view but preserved in system. | Hidden |

### State Transitions

Not all transitions are allowed. Valid transitions are:

| From State | Allowed Transitions |
|------------|---------------------|
| Draft | In Review |
| In Review | Draft, Approved |
| Approved | In Review, Published |
| Published | Archived |
| Archived | Draft |

### Publishing Behavior

When content transitions to **Published**:
1. A `publishedAt` timestamp is automatically set
2. The content becomes visible on the public site
3. It appears in content lists, feeds, and archive pages

## Content Relationships

Each content item can have multiple relationships to other entities:

### Author Relationship

Content can have one or more authors with different roles:

| Role | Description |
|------|-------------|
| **PRIMARY** | Main author, displayed prominently |
| **CONTRIBUTOR** | Additional contributors |
| **EDITOR** | Editorial oversight |

For Posts and Articles, a primary author is required for creating revisions.

### Category Relationship

Content can belong to multiple categories with these properties:

| Property | Type | Description |
|----------|------|-------------|
| `featured` | boolean | Highlight in category listings |
| `position` | number | Custom sort order within category |

Categories support hierarchical organization (parent/child relationships).

### Media Relationship

Attach media files to content with specific roles:

| Role | Description |
|------|-------------|
| **FEATURED** | Primary image for cards and social sharing |
| **GALLERY** | Additional images for galleries |
| **INLINE** | Images embedded within content blocks |
| **ATTACHMENT** | Downloadable files |

### Tags

Tags provide a flat taxonomy for content:
- Stored as an array of strings
- Create archive pages at `/tag/[tag]`
- Can be filtered and searched
- No hierarchy (unlike categories)

## Content Blocks

Content is structured as a series of blocks, each with a specific type:

| Block Type | Description | Content Fields |
|------------|-------------|----------------|
| **PARAGRAPH** | Regular text content | `text`, `format` |
| **HEADING** | Section headers | `text`, `level` (1-6) |
| **IMAGE** | Inline images | `caption`, `alt`, `src` |
| **QUOTE** | Blockquotes | `text`, `attribution` |
| **CODE** | Code snippets | `code`, `language`, `filename` |
| **CALLOUT** | Alert boxes | `text`, `variant`, `title` |
| **LIST** | Ordered/unordered lists | `items`, `ordered` |
| **DIVIDER** | Visual separators | `style` |
| **EMBED** | External content | `displayStyle`, `contentId`, `url` |

## System Content Protection

Demo/seeded content is protected from modification:

- Content with `isSystem: true` cannot be edited or deleted
- API returns `403 Forbidden` with message: "Demo [entity] cannot be modified"
- Users must create new content for testing and customization

This ensures the demo environment remains consistent for new users.

## Best Practices

### Slugs
- Use descriptive, URL-safe slugs
- Keep slugs short but meaningful
- Avoid changing slugs after publication (breaks existing links)

### Content Organization
- Use categories for broad groupings
- Use tags for specific topics or keywords
- Leverage the excerpt field for content cards and SEO

### Workflow
- Use Draft state for work in progress
- Submit for review when ready for editorial feedback
- Only publish when content is complete and reviewed

## Related Documentation

- [Revision System](revision-system.md) - Version history and restoration
- [Admin Interface Guide](admin-guide.md) - Content editor walkthrough
- [Public Site](public-site.md) - How content appears on the frontend

