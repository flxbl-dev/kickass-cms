# Page System

The Page system in Kickass CMS allows you to create custom pages with flexible layouts and modular content sections. Unlike Posts and Articles, Pages provide complete control over structure and URL paths.

## Overview

Pages are independent from the Content entity and provide:
- Custom URL paths (e.g., `/about`, `/services/consulting`)
- Hierarchical parent/child relationships
- Modular section-based structure
- Navigation inclusion control
- Category-based content filtering

## Page Structure

### Basic Properties

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Page title |
| `slug` | string | URL-safe identifier |
| `path` | string | Full URL path (e.g., `/technology-news`) |
| `description` | string | SEO description |
| `isPublished` | boolean | Whether page is publicly visible |
| `showInNav` | boolean | Include in site navigation |
| `navOrder` | number | Position in navigation menu |

### URL Path Generation

The `path` is automatically generated from the page hierarchy:

```
Root page: /about
  Child page: /about/team
    Grandchild: /about/team/leadership
```

When you change a page's parent, its path and all descendant paths are automatically updated.

## Page Sections

Pages are composed of modular sections, each with a specific type and configuration.

### Section Types

| Section Type | Purpose | Use Case |
|--------------|---------|----------|
| **CONTENT_LIST** | Grid/list of content items | Blog feed, article archives |
| **SINGLE_CONTENT** | Embed specific content | Hero content, featured post |
| **STATIC_BLOCK** | Custom HTML/markdown | Custom text, embedded widgets |
| **GLOBAL_BLOCK** | Reusable components | Newsletter signup, CTAs |

### CONTENT_LIST Configuration

Display a filtered list of content items:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | number | 10 | Items to display |
| `orderBy` | string | `publishedAt` | Sort field |
| `orderDirection` | `ASC`/`DESC` | `DESC` | Sort direction |
| `contentType` | enum | all | Filter: POST, ARTICLE, or all |
| `showPagination` | boolean | true | Show pagination controls |

Example configurations:
- **Blog feed**: limit: 6, orderBy: publishedAt, contentType: POST
- **Featured articles**: limit: 3, orderBy: publishedAt, contentType: ARTICLE
- **All content**: limit: 12, orderDirection: DESC

### SINGLE_CONTENT Configuration

Embed a specific content item:

| Option | Type | Description |
|--------|------|-------------|
| `displayStyle` | enum | Presentation: `full`, `card`, `hero` |

Use cases:
- Hero section with featured content
- Highlighted post in sidebar
- Embedded article within a page

### GLOBAL_BLOCK Types

Reusable components that can appear on multiple pages:

| Block Type | Purpose |
|------------|---------|
| **AUTHOR_BIO** | Author information card |
| **RELATED_POSTS** | Related content suggestions |
| **NEWSLETTER** | Email signup form |
| **CTA** | Call-to-action button/section |
| **CUSTOM** | Custom component |

## Category Filtering

Pages can filter content by category using the `PAGE_FILTERS_CATEGORY` relationship.

### How It Works

1. In page settings, select one or more categories
2. All CONTENT_LIST sections on that page automatically filter by those categories
3. Combines with section-level content type filtering

### Example

A page with:
- Category filter: "Technology"
- Section 1: CONTENT_LIST (contentType: POST)
- Section 2: CONTENT_LIST (contentType: ARTICLE)

Result:
- Section 1 shows only Technology posts
- Section 2 shows only Technology articles

### Multiple Categories

When multiple categories are selected:
- Content matching **any** of the selected categories is included
- This creates an "OR" filter, not "AND"

## Page Hierarchy

Pages support parent/child relationships for organizing content.

### Navigation Tree

```
Home (/)
├── About (/about)
│   ├── Team (/about/team)
│   └── History (/about/history)
├── Blog (/blog)
└── Services (/services)
    ├── Consulting (/services/consulting)
    └── Training (/services/training)
```

### Setting a Parent

When creating or editing a page:
1. Select a parent page from the dropdown
2. The path is automatically updated
3. Child pages inherit navigation context

### Root Pages

Pages without a parent are "root pages" and appear at the top level of navigation and the page tree.

## Navigation

### Including Pages in Navigation

Set `showInNav: true` to include a page in the site navigation.

| Property | Effect |
|----------|--------|
| `showInNav: true` | Page appears in header/footer navigation |
| `showInNav: false` | Page exists but not in navigation |
| `navOrder` | Controls position (lower = earlier) |

### Navigation Order

Pages are sorted by `navOrder` within their hierarchy level:
- navOrder: 1 → First position
- navOrder: 2 → Second position
- navOrder: null → Sorted by title alphabetically

## Publishing

### Draft vs Published

| State | Visibility |
|-------|------------|
| `isPublished: false` | Only visible in admin |
| `isPublished: true` | Visible on public site |

### Immediate Updates

Unlike content with workflow states, page publishing is immediate:
- Toggle `isPublished` to true
- Page appears on the public site instantly
- Same for unpublishing

## API Reference

For developers, page operations are in `src/lib/flxbl/pages.ts`:

```typescript
import {
  getPageByPath,
  getPageBySlug,
  getPublishedPages,
  getPageSections,
  getPageFilterCategories,
  getNavigationTree,
  getFilteredContentForPage,
} from "@/lib/flxbl/pages";

// Get page by URL path
const page = await getPageByPath(client, "/about/team");

// Get sections for a page
const sections = await getPageSections(client, pageId);

// Get content filtered by page's categories
const content = await getFilteredContentForPage(client, pageId, {
  limit: 10,
  contentType: "POST",
});

// Build navigation tree
const nav = await getNavigationTree(client, true); // published only
```

## Best Practices

### Page Organization
- Use clear, descriptive slugs
- Keep hierarchy shallow (2-3 levels max)
- Use category filters instead of duplicating pages

### Section Design
- Lead with important content (hero/featured)
- Use CONTENT_LIST for dynamic content
- Use GLOBAL_BLOCK for consistent elements (CTAs, newsletters)

### Navigation
- Include key pages in navigation
- Use navOrder for consistent ordering
- Keep navigation simple and scannable

## Related Documentation

- [Content Management](content-management.md) - Content types and workflow
- [Admin Interface Guide](admin-guide.md) - Page editor walkthrough
- [Public Site](public-site.md) - URL routing

