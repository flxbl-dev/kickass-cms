/**
 * Block Persistence Utilities
 * 
 * Converts between Tiptap JSON and FLXBL ContentBlock entities
 */

import type { FlxblClient } from "./client";
import type { ContentBlock, CreateContentBlock, BlockType } from "./types";

// =============================================================================
// Tiptap to FLXBL Conversion
// =============================================================================

export interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

/**
 * Map Tiptap node types to FLXBL block types
 * Note: CALLOUT is mapped from blockquote with data-callout attribute
 * Note: EMBED is a custom node type for embedded content
 */
function mapTiptapTypeToBlockType(tiptapType: string, attrs?: Record<string, unknown>): BlockType | null {
  // Check for callout variant (blockquote with callout attribute)
  if (tiptapType === "blockquote" && attrs?.["data-callout"]) {
    return "CALLOUT";
  }

  // Check for embed type
  if (tiptapType === "embed") {
    return "EMBED";
  }

  const mapping: Record<string, BlockType> = {
    paragraph: "PARAGRAPH",
    heading: "HEADING",
    image: "IMAGE",
    blockquote: "QUOTE",
    codeBlock: "CODE",
    bulletList: "LIST",
    orderedList: "LIST",
    horizontalRule: "DIVIDER",
  };

  return mapping[tiptapType] ?? null;
}

/**
 * Extract text content from a Tiptap node
 */
function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractText).join("");
}

/**
 * Convert a single Tiptap node to block content
 */
function tiptapNodeToBlockContent(node: TiptapNode, blockType: BlockType): Record<string, unknown> | null {
  switch (node.type) {
    case "paragraph":
      return {
        text: extractText(node),
        format: "plain",
      };

    case "heading":
      return {
        text: extractText(node),
        level: node.attrs?.level ?? 2,
      };

    case "image":
      return {
        caption: node.attrs?.alt ?? null,
        alt: node.attrs?.alt ?? null,
        src: node.attrs?.src,
      };

    case "blockquote":
      // Check if this is a callout (blockquote with special attribute)
      if (blockType === "CALLOUT") {
        return {
          text: node.content?.map(extractText).join("\n") ?? "",
          variant: (node.attrs?.["data-callout-variant"] as string) ?? "info",
          title: (node.attrs?.["data-callout-title"] as string) ?? null,
        };
      }
      return {
        text: node.content?.map(extractText).join("\n") ?? "",
        attribution: null,
      };

    case "codeBlock":
      return {
        code: extractText(node),
        language: node.attrs?.language ?? null,
      };

    case "bulletList":
      return {
        items: node.content?.map((item) => extractText(item)) ?? [],
        ordered: false,
      };

    case "orderedList":
      return {
        items: node.content?.map((item) => extractText(item)) ?? [],
        ordered: true,
      };

    case "horizontalRule":
      return {
        style: "line",
      };

    case "embed":
      return {
        displayStyle: (node.attrs?.displayStyle as string) ?? "card",
        contentId: node.attrs?.contentId ?? null,
        url: node.attrs?.url ?? null,
      };

    default:
      return null;
  }
}

/**
 * Convert Tiptap JSON document to array of FLXBL block data
 */
export function tiptapToBlocks(doc: TiptapDoc): CreateContentBlock[] {
  const blocks: CreateContentBlock[] = [];

  if (!doc.content) return blocks;

  doc.content.forEach((node, index) => {
    const blockType = mapTiptapTypeToBlockType(node.type, node.attrs);
    if (!blockType) return;

    const content = tiptapNodeToBlockContent(node, blockType);
    if (!content) return;

    blocks.push({
      blockType,
      content,
      position: index,
      metadata: {},
    });
  });

  return blocks;
}

// =============================================================================
// FLXBL to Tiptap Conversion
// =============================================================================

/**
 * Convert a FLXBL block to Tiptap node
 */
function blockToTiptapNode(
  block: Pick<ContentBlock, "blockType" | "content" | "position">
): TiptapNode | null {
  const content = block.content as Record<string, unknown>;

  switch (block.blockType) {
    case "PARAGRAPH":
      return {
        type: "paragraph",
        content: [{ type: "text", text: (content.text as string) || "" }],
      };

    case "HEADING":
      return {
        type: "heading",
        attrs: { level: (content.level as number) || 2 },
        content: [{ type: "text", text: (content.text as string) || "" }],
      };

    case "IMAGE":
      return {
        type: "image",
        attrs: {
          src: content.src || "",
          alt: content.alt || content.caption || "",
        },
      };

    case "QUOTE":
      return {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: (content.text as string) || "" }],
          },
        ],
      };

    case "CODE":
      return {
        type: "codeBlock",
        attrs: { language: content.language || "typescript" },
        content: [{ type: "text", text: (content.code as string) || "" }],
      };

    case "LIST":
      const listType = content.ordered ? "orderedList" : "bulletList";
      const items = (content.items as string[]) || [];
      return {
        type: listType,
        content: items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: item }],
            },
          ],
        })),
      };

    case "DIVIDER":
      return {
        type: "horizontalRule",
      };

    case "CALLOUT":
      return {
        type: "blockquote",
        attrs: {
          "data-callout": true,
          "data-callout-variant": content.variant || "info",
          "data-callout-title": content.title || null,
        },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: (content.text as string) || "" }],
          },
        ],
      };

    case "EMBED":
      return {
        type: "embed",
        attrs: {
          displayStyle: content.displayStyle || "card",
          contentId: content.contentId || null,
          url: content.url || null,
        },
      };

    default:
      return null;
  }
}

/**
 * Convert array of FLXBL blocks to Tiptap JSON document
 * Accepts either ContentBlock (full entity) or CreateContentBlock (DTO)
 */
export function blocksToTiptap(
  blocks: Array<Pick<ContentBlock, "blockType" | "content" | "position">>
): TiptapDoc {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  return {
    type: "doc",
    content: sortedBlocks
      .map(blockToTiptapNode)
      .filter((node): node is TiptapNode => node !== null),
  };
}

// =============================================================================
// Block Persistence Operations
// =============================================================================

/**
 * Save blocks for a content item
 */
export async function saveContentBlocks(
  client: FlxblClient,
  contentId: string,
  tiptapDoc: TiptapDoc
): Promise<ContentBlock[]> {
  // Convert Tiptap to blocks
  const newBlocks = tiptapToBlocks(tiptapDoc);

  // Get existing blocks
  const existingRels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_BLOCK",
    "out",
    "ContentBlock"
  );

  // Delete existing blocks
  for (const rel of existingRels) {
    await client.deleteRelationship("Content", contentId, "HAS_BLOCK", rel.target.id);
    await client.delete("ContentBlock", rel.target.id);
  }

  // Create new blocks
  const createdBlocks: ContentBlock[] = [];

  for (let i = 0; i < newBlocks.length; i++) {
    const block = await client.create("ContentBlock", {
      ...newBlocks[i],
      position: i,
    });

    await client.createRelationship(
      "Content",
      contentId,
      "HAS_BLOCK",
      block.id,
      { position: i }
    );

    createdBlocks.push(block);
  }

  return createdBlocks;
}

/**
 * Load blocks for a content item
 */
export async function loadContentBlocks(
  client: FlxblClient,
  contentId: string
): Promise<ContentBlock[]> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_BLOCK",
    "out",
    "ContentBlock"
  );

  return rels
    .map((r) => r.target)
    .sort((a, b) => a.position - b.position);
}

/**
 * Load blocks as Tiptap document
 */
export async function loadContentAsTiptap(
  client: FlxblClient,
  contentId: string
): Promise<TiptapDoc> {
  const blocks = await loadContentBlocks(client, contentId);
  return blocksToTiptap(blocks);
}

