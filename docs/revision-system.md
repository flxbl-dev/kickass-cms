# Revision System

Kickass CMS includes a robust revision system that automatically tracks changes to content, allowing you to view history and restore previous versions.

## Overview

The revision system provides:
- **Automatic version history** on every save
- **Non-destructive restoration** that creates new revisions
- **Change tracking** with optional messages
- **Author attribution** for each revision

## How Revisions Work

### Automatic Creation

Revisions are created automatically:

1. **Initial revision** - Created when content is first saved
2. **Update revisions** - Created on every subsequent save
3. **Restore revisions** - Created when restoring a previous version

Each revision captures:
- Content title
- All content blocks (as a snapshot)
- Timestamp
- Author who made the change
- Optional change message

### What Gets Preserved

| Preserved in Revision | Not Preserved |
|----------------------|---------------|
| Title | Workflow state |
| All content blocks | Author relationships |
| Block positions | Category relationships |
| Block metadata | Media relationships |
| Block types | Tags |

Relationships (authors, categories, media, tags) remain current and are not affected by revision restoration.

## Viewing Revisions

In the content editor, the revision history panel shows:
- Revision number (#1, #2, etc.)
- Date and time of creation
- Author who made the change
- Change message (if provided)
- Current revision indicator

Revisions are displayed in reverse chronological order (newest first).

## Restoring Revisions

### How Restoration Works

When you restore a revision:

1. The selected revision's content blocks are loaded
2. Current content blocks are deleted
3. Blocks from the revision snapshot are recreated
4. Content title is updated to match the revision
5. A **new revision** is created with message: "Restored from revision #N"

This non-destructive approach means:
- You never lose any version history
- The restoration itself becomes part of the history
- You can restore from a restoration

### What Gets Restored

| Restored | Not Affected |
|----------|-------------|
| Title | Workflow state |
| Content blocks | Author |
| Block positions | Categories |
| | Media attachments |
| | Tags |

### Restoration Example

```
Timeline:
  #1 - Initial version
  #2 - Updated content
  #3 - Major changes
  #4 - Restored from revision #1
  #5 - Further edits after restore
```

If you restore revision #1 from revision #3, a new revision #4 is created. The content matches #1, but you still have access to #2 and #3.

## Comparing Revisions

The system can compare two revisions and identify:
- Title changes
- Blocks added
- Blocks removed
- Blocks modified

This helps you understand what changed between versions.

## Requirements

### Author Requirement

To create revisions, content must have an associated author. This is automatically handled for:
- **Posts** - Always have a primary author
- **Articles** - Always have a primary author

Landing content (PAGE type) may not have an author, so revision creation depends on having an assigned author.

### System Content

System/demo content (`isSystem: true`) can have revisions viewed but not restored, as system content cannot be modified.

## API Reference

For developers, the revision system is exposed through `src/lib/flxbl/revisions.ts`:

```typescript
import {
  createRevision,
  getRevisions,
  getRevision,
  getCurrentRevision,
  restoreRevision,
  compareRevisions,
} from "@/lib/flxbl/revisions";

// Create a revision manually
await createRevision(client, contentId, authorId, "Optional message");

// Get all revisions for content
const revisions = await getRevisions(client, contentId);

// Get the current (active) revision
const current = await getCurrentRevision(client, contentId);

// Restore a specific revision
await restoreRevision(client, contentId, revisionId, authorId);

// Compare two revisions
const diff = compareRevisions(revision1, revision2);
```

## Best Practices

### Change Messages

Provide descriptive change messages for significant updates:
- "Added new section on performance"
- "Fixed typo in introduction"
- "Complete rewrite of examples"

### Before Major Changes

If you're about to make substantial changes:
1. Ensure the current state is saved (creates a revision)
2. Make your changes
3. Add a descriptive change message

### Regular Saves

The system automatically creates revisions on save, so:
- Save regularly to create restore points
- Don't worry about creating too many revisions
- Use change messages for important milestones

## Related Documentation

- [Content Management](content-management.md) - Content types and workflow
- [Admin Interface Guide](admin-guide.md) - Using the revision panel
- [Developer Guide](developer-guide.md) - API details

