# Kickass CMS Documentation

A modern, block-based content management system built with Next.js 16, React 19, and FLXBL backend.

## Table of Contents

### Getting Started
- [Quick Start Guide](getting-started.md) - Installation, setup, and first steps

### User Guides
- [Content Management](content-management.md) - Creating and managing content
- [Revision System](revision-system.md) - Version history and restoration
- [Page System](page-system.md) - Building pages with sections
- [Admin Interface Guide](admin-guide.md) - Complete admin UI walkthrough

### Reference
- [Public Site & Routing](public-site.md) - URL patterns and archives
- [Developer Guide](developer-guide.md) - Architecture and API reference
- [Schema Reference](schema-reference.md) - FLXBL entities, fields, and relationships

---

## Quick Links

### Common Tasks

| Task | Documentation |
|------|---------------|
| Create a new blog post | [Content Management](content-management.md#creating-content) |
| Restore a previous version | [Revision System](revision-system.md#restoring-revisions) |
| Build a landing page | [Page System](page-system.md#page-sections) |
| Filter content by category | [Page System](page-system.md#category-filtering) |
| Understand URL structure | [Public Site](public-site.md#url-routing) |

### Content Types at a Glance

| Type | URL Pattern | Use Case |
|------|-------------|----------|
| Post | `/blog/[slug]` | Blog posts, news updates |
| Article | `/articles/[slug]` | Long-form content, tutorials |
| Landing Content | Via Page system | Marketing pages, static content |

### Workflow States

```
Draft → In Review → Approved → Published → Archived
```

---

## Architecture Overview

Kickass CMS uses a decoupled architecture:

- **Frontend**: Next.js 16 App Router with React Server Components
- **Backend**: FLXBL graph database as a service
- **Editor**: Tiptap 3 block-based rich text editor
- **UI**: shadcn/ui components with Tailwind CSS 4

For detailed technical information, see the [Developer Guide](developer-guide.md).

---

## Screenshots

See the [Admin Interface Guide](admin-guide.md) for visual walkthroughs of:
- Content list and filtering
- Block editor with Tiptap
- Page tree management
- Media library
- Revision history

