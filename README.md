# Kickass CMS

A modern, flexible content management system built with Next.js 16 and FLXBL backend-as-a-service.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [FLXBL](https://flxbl.dev) | Graph database backend-as-a-service |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) | Accessible UI components |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Zod](https://zod.dev) | Schema validation |
| [Vitest](https://vitest.dev) | Testing framework |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- FLXBL account and API key

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env.local

# Edit .env.local with your FLXBL credentials
# FLXBL_BASE_URL=https://api.flxbl.dev
# FLXBL_API_KEY=your_api_key_here
```

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## FLXBL Backend

This project uses [FLXBL](https://flxbl.dev) as a backend-as-a-service, providing:

- **Graph database** for flexible content relationships
- **REST API & GraphQL** endpoints
- **Query DSL** for complex graph traversals
- **Relationship properties** for rich metadata on connections
- **Automatic migrations** when schema changes

### Schema Management with FLXBL MCP

The FLXBL schema is managed using the **FLXBL MCP tool**. When working with an AI assistant (like Claude in Cursor), use the FLXBL MCP to:

- Validate schema changes before publishing
- Publish new schema versions
- Generate TypeScript types from the schema
- View OpenAPI and GraphQL specifications

Example MCP commands:
- `validate_schema` - Check schema for errors
- `publish_schema_version` - Deploy schema changes
- `generate_client_types` - Generate Zod schemas
- `get_api_spec` - View REST API documentation
- `get_graphql_schema` - View GraphQL SDL

### Current Schema

**Entities:**
- `Content` - Pages, posts, articles with status, metadata, tags
- `Author` - Content creators with bio and avatar
- `Category` - Hierarchical content organization
- `Media` - Images, files, and video assets

**Relationships with Properties:**
- `AUTHORED_BY` - Links content to authors with `role` (PRIMARY/CONTRIBUTOR/EDITOR) and `byline`
- `CATEGORIZED_AS` - Links content to categories with `featured` flag and `position`
- `HAS_MEDIA` - Links content to media with `role` (FEATURED/GALLERY/INLINE/ATTACHMENT), `position`, and `caption`

## Project Structure

```
kickass-cms/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Tailwind styles
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── theme-provider.tsx  # Dark mode provider
│   │   └── theme-toggle.tsx    # Theme switcher
│   └── lib/
│       ├── flxbl/              # FLXBL client library
│       │   ├── client.ts       # Type-safe API client
│       │   ├── config.ts       # Environment configuration
│       │   ├── queries.ts      # Query builder helpers
│       │   ├── types.ts        # Zod schemas and types
│       │   └── index.ts        # Public exports
│       └── utils.ts            # Utility functions
├── vitest.config.mts           # Test configuration
├── env.example                 # Environment template
└── package.json
```

## Usage

### FLXBL Client

```typescript
import { getFlxblClient } from "@/lib/flxbl";

// In a server component
const client = getFlxblClient();

// List content
const posts = await client.list("Content", { limit: 10 });

// Query with filters
const published = await client.query("Content", {
  where: { status: { $eq: "PUBLISHED" } },
  orderBy: "publishedAt",
  orderDirection: "DESC",
});

// Graph traversal - get content with featured media
const withMedia = await client.query("Content", {
  traverse: [{
    relationship: "HAS_MEDIA",
    direction: "out",
    where: { role: { $eq: "FEATURED" } },
  }],
});
```

### Query Helpers

```typescript
import {
  getPublishedContent,
  getContentBySlug,
  getContentWithPrimaryAuthor,
} from "@/lib/flxbl";

const client = getFlxblClient();

// Get published content
const posts = await getPublishedContent(client, { limit: 10 });

// Get by slug
const post = await getContentBySlug(client, "my-article");

// Get with primary author
const { content, author } = await getContentWithPrimaryAuthor(client, postId);
```

## License

MIT
