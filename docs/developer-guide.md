# Developer Guide

This guide covers the technical architecture, API patterns, and extension points for Kickass CMS.

## Architecture Overview

Kickass CMS is built with a modern, decoupled architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                  │
├───────────────────┬─────────────────────────────────────┤
│   React Server    │         Client Components           │
│   Components      │   (Editor, Forms, Interactivity)    │
├───────────────────┴─────────────────────────────────────┤
│                  FLXBL Client Library                   │
│             (src/lib/flxbl/)                            │
├─────────────────────────────────────────────────────────┤
│                    FLXBL Graph API                      │
│             (External Backend Service)                  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 | App Router, SSG, API routes |
| UI Library | React 19 | Component-based UI |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Components | shadcn/ui | Accessible UI primitives |
| Editor | Tiptap 3 | Block-based rich text |
| Validation | Zod 4 | Schema validation |
| Backend | FLXBL | Graph database BaaS |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin route group (shared layout)
│   │   └── admin/         # Admin pages
│   │       ├── content/   # Content CRUD
│   │       ├── pages/     # Page management
│   │       └── media/     # Media library
│   ├── api/               # API route handlers
│   │   └── admin/         # Admin API endpoints
│   ├── blog/              # Public blog routes
│   ├── articles/          # Public article routes
│   └── [...path]/         # Dynamic page routing
├── components/
│   ├── admin/             # Admin-specific components
│   ├── blocks/            # Content block renderers
│   ├── editor/            # Tiptap block editor
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
└── lib/
    └── flxbl/             # FLXBL client library
        ├── client.ts      # API client
        ├── types.ts       # Entity schemas
        ├── queries.ts     # Query helpers
        ├── blocks.ts      # Block operations
        ├── revisions.ts   # Revision system
        ├── workflow.ts    # State management
        └── pages.ts       # Page operations
```

## FLXBL Client

### Configuration

The FLXBL client is configured via environment variables:

```typescript
// src/lib/flxbl/config.ts
import { createFlxblClient } from "./client";

export function getFlxblClient() {
  return createFlxblClient({
    baseUrl: process.env.FLXBL_BASE_URL!,
    apiKey: process.env.FLXBL_API_KEY!,
  });
}
```

The config module imports `"server-only"` to prevent client-side usage.

### Basic Operations

```typescript
import { getFlxblClient } from "@/lib/flxbl/config";

const client = getFlxblClient();

// List entities with pagination
const content = await client.list("Content", {
  limit: 10,
  offset: 0,
  orderBy: "updatedAt",
  orderDirection: "DESC",
});

// Get single entity
const post = await client.get("Content", id);

// Create entity
const newPost = await client.create("Content", {
  title: "My Post",
  slug: "my-post",
  contentType: "POST",
});

// Update entity
const updated = await client.update("Content", id, data);

// Partial update
const patched = await client.patch("Content", id, { title: "New Title" });

// Delete entity
await client.delete("Content", id);
```

### Query DSL

Execute complex queries with filtering and traversal:

```typescript
const results = await client.query("Content", {
  where: {
    contentType: { $eq: "POST" },
    publishedAt: { $gte: new Date("2024-01-01") },
    tags: { $contains: "featured" },
  },
  orderBy: "publishedAt",
  orderDirection: "DESC",
  limit: 10,
});
```

Available operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$contains`

### Relationship Operations

```typescript
// Create relationship
await client.createRelationship(
  "Content", contentId,
  "AUTHORED_BY", authorId,
  { role: "PRIMARY", byline: null }
);

// Get relationships
const authors = await client.getRelationships(
  "Content", contentId,
  "AUTHORED_BY", "out", "Author"
);

// Update relationship properties
await client.updateRelationship(
  "Content", contentId,
  "AUTHORED_BY", authorId,
  { byline: "Special Correspondent" }
);

// Delete relationship
await client.deleteRelationship(
  "Content", contentId,
  "AUTHORED_BY", authorId
);
```

## Entity Types

All entities are defined as Zod schemas in `src/lib/flxbl/types.ts`:

### Content Entity

```typescript
const ContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullish(),
  contentType: z.enum(["PAGE", "POST", "ARTICLE"]),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  publishedAt: z.coerce.date().nullish(),
  tags: z.array(z.string()).nullish(),
  isSystem: z.boolean().nullish(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
```

### Other Entities

| Entity | Description |
|--------|-------------|
| `Author` | Content creators |
| `Category` | Hierarchical organization |
| `Media` | Images, files, videos |
| `ContentBlock` | Block-based content |
| `ContentRevision` | Version history |
| `WorkflowState` | Lifecycle states |
| `Page` | CMS pages |
| `PageSection` | Page content sections |

## Server vs Client Components

### Server Components (Default)

Used for data fetching:

```typescript
// src/app/(admin)/admin/content/page.tsx
import { getFlxblClient } from "@/lib/flxbl/config";

export default async function ContentListPage() {
  const client = getFlxblClient();
  const content = await client.list("Content");
  return <ContentTable data={content} />;
}
```

### Client Components

Mark with `"use client"` for interactivity:

```typescript
"use client";

import { useState } from "react";

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## API Routes

API routes handle admin operations in `src/app/api/admin/`:

### Route Structure

```
api/admin/
├── content/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts       # GET, PUT, PATCH, DELETE
│       └── revisions/
│           └── route.ts   # GET revisions
├── pages/
│   └── route.ts
├── media/
│   └── route.ts
└── categories/
    └── route.ts
```

### Route Pattern

```typescript
// src/app/api/admin/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFlxblClient } from "@/lib/flxbl/config";

export async function GET(request: NextRequest) {
  const client = getFlxblClient();
  const content = await client.list("Content");
  return NextResponse.json(content);
}

export async function POST(request: NextRequest) {
  const client = getFlxblClient();
  const data = await request.json();
  const content = await client.create("Content", data);
  return NextResponse.json(content);
}
```

### Route Params (Next.js 16)

Route params are now Promises:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Use id...
}
```

## Block Editor

The Tiptap-based editor is in `src/components/editor/`:

### Editor Components

| Component | Purpose |
|-----------|---------|
| `BlockEditor` | Main editor component |
| `Toolbar` | Formatting toolbar |
| `BlockMenu` | Block type insertion menu |

### Tiptap Integration

```typescript
// src/lib/flxbl/blocks.ts
import { tiptapToBlocks, blocksToTiptap } from "./blocks";

// Save editor content
await saveContentBlocks(client, contentId, tiptapDoc);

// Load as Tiptap document
const doc = await loadContentAsTiptap(client, contentId);
```

## Workflow System

Workflow operations are in `src/lib/flxbl/workflow.ts`:

```typescript
import {
  getContentState,
  getAllowedTransitions,
  transitionState,
  validateTransition,
} from "@/lib/flxbl/workflow";

// Get current state
const { state } = await getContentState(client, contentId);

// Check allowed transitions
const allowed = await getAllowedTransitions(client, state.slug);

// Transition to new state
await transitionState(client, contentId, newStateId, "admin");
```

## Revision System

Revision operations are in `src/lib/flxbl/revisions.ts`:

```typescript
import {
  createRevision,
  getRevisions,
  restoreRevision,
} from "@/lib/flxbl/revisions";

// Create revision
await createRevision(client, contentId, authorId, "Updated content");

// Get all revisions
const revisions = await getRevisions(client, contentId);

// Restore revision
await restoreRevision(client, contentId, revisionId, authorId);
```

## Error Handling

```typescript
import { FlxblError } from "@/lib/flxbl/client";

try {
  await client.get("Content", id);
} catch (error) {
  if (error instanceof FlxblError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  }
}
```

## Testing

Tests are in `src/lib/flxbl/__tests__/` using Vitest:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run
```

### Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("ContentSchema", () => {
  it("validates valid content", () => {
    const result = ContentSchema.safeParse({
      id: "123",
      title: "Test",
      // ...
    });
    expect(result.success).toBe(true);
  });
});
```

## Common Patterns

### Parallel Data Fetching

```typescript
const [authors, categories, states] = await Promise.all([
  client.list("Author"),
  client.list("Category"),
  client.list("WorkflowState"),
]);
```

### System Content Protection

```typescript
if (content.isSystem) {
  return NextResponse.json(
    { error: "Demo content cannot be modified" },
    { status: 403 }
  );
}
```

### Path Alias

Always use `@/` for imports from `src/`:

```typescript
import { Button } from "@/components/ui/button";
import { getFlxblClient } from "@/lib/flxbl/config";
```

## Extension Points

### Adding New Block Types

1. Define schema in `src/lib/flxbl/types.ts`
2. Add renderer in `src/components/blocks/`
3. Update `BlockRenderer` switch statement
4. Add Tiptap extension if needed

### Adding New Entities

1. Define Zod schema in `types.ts`
2. Add to `entitySchemas` map
3. Create API routes
4. Create admin UI components

### Custom Workflow States

1. Update seed script or use FLXBL dashboard
2. Configure `allowedTransitions` array
3. Update UI to reflect new states

## Related Documentation

- [Content Management](content-management.md) - Business logic
- [Page System](page-system.md) - Page configuration
- [Admin Guide](admin-guide.md) - UI reference

