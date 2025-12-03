import { describe, it, expect } from "vitest";
import { tiptapToBlocks, blocksToTiptap } from "../blocks";
import type { TiptapDoc } from "../blocks";
import type { CreateContentBlock } from "../types";

describe("Block Conversion Utilities", () => {
  describe("tiptapToBlocks", () => {
    it("should convert paragraph node to PARAGRAPH block", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("PARAGRAPH");
      expect(blocks[0].position).toBe(0);
      expect(blocks[0].content).toHaveProperty("text");
    });

    it("should convert heading node to HEADING block with correct level", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "My Heading" }],
          },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("HEADING");
      expect((blocks[0].content as { level: number }).level).toBe(2);
    });

    it("should convert code block with language", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            attrs: { language: "typescript" },
            content: [{ type: "text", text: "const x = 1;" }],
          },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("CODE");
      expect((blocks[0].content as { language: string }).language).toBe("typescript");
    });

    it("should convert blockquote to QUOTE block", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "A famous quote" }],
              },
            ],
          },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("QUOTE");
    });

    it("should convert bulletList to LIST block", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Item 1" }] },
                ],
              },
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Item 2" }] },
                ],
              },
            ],
          },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("LIST");
      expect((blocks[0].content as { ordered: boolean }).ordered).toBe(false);
    });

    it("should convert orderedList to LIST block with ordered flag", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "First" }] },
                ],
              },
            ],
          },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("LIST");
      expect((blocks[0].content as { ordered: boolean }).ordered).toBe(true);
    });

    it("should convert horizontal rule to DIVIDER block", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          { type: "horizontalRule" },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe("DIVIDER");
    });

    it("should handle empty document", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(0);
    });

    it("should assign sequential positions to multiple blocks", () => {
      const tiptapJson: TiptapDoc = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "First" }] },
          { type: "paragraph", content: [{ type: "text", text: "Second" }] },
          { type: "paragraph", content: [{ type: "text", text: "Third" }] },
        ],
      };

      const blocks = tiptapToBlocks(tiptapJson);
      
      expect(blocks).toHaveLength(3);
      expect(blocks[0].position).toBe(0);
      expect(blocks[1].position).toBe(1);
      expect(blocks[2].position).toBe(2);
    });
  });

  describe("blocksToTiptap", () => {
    it("should convert PARAGRAPH block to tiptap paragraph", () => {
      const blocks: CreateContentBlock[] = [
        {
          blockType: "PARAGRAPH",
          content: { text: "Hello world", format: "markdown" },
          position: 0,
          metadata: {},
        },
      ];

      const tiptapJson = blocksToTiptap(blocks);
      
      expect(tiptapJson.type).toBe("doc");
      expect(tiptapJson.content).toHaveLength(1);
      expect(tiptapJson.content[0].type).toBe("paragraph");
    });

    it("should convert HEADING block with level to tiptap heading", () => {
      const blocks: CreateContentBlock[] = [
        {
          blockType: "HEADING",
          content: { text: "My Title", level: 1 },
          position: 0,
          metadata: {},
        },
      ];

      const tiptapJson = blocksToTiptap(blocks);
      
      expect(tiptapJson.content[0].type).toBe("heading");
      expect(tiptapJson.content[0].attrs?.level).toBe(1);
    });

    it("should convert CODE block to tiptap codeBlock", () => {
      const blocks: CreateContentBlock[] = [
        {
          blockType: "CODE",
          content: { code: "const x = 1;", language: "typescript" },
          position: 0,
          metadata: {},
        },
      ];

      const tiptapJson = blocksToTiptap(blocks);
      
      expect(tiptapJson.content[0].type).toBe("codeBlock");
      expect(tiptapJson.content[0].attrs?.language).toBe("typescript");
    });

    it("should convert DIVIDER block to horizontalRule", () => {
      const blocks: CreateContentBlock[] = [
        {
          blockType: "DIVIDER",
          content: { style: "line" },
          position: 0,
          metadata: {},
        },
      ];

      const tiptapJson = blocksToTiptap(blocks);
      
      expect(tiptapJson.content[0].type).toBe("horizontalRule");
    });

    it("should sort blocks by position", () => {
      const blocks: CreateContentBlock[] = [
        {
          blockType: "PARAGRAPH",
          content: { text: "Third", format: "plain" },
          position: 2,
          metadata: {},
        },
        {
          blockType: "PARAGRAPH",
          content: { text: "First", format: "plain" },
          position: 0,
          metadata: {},
        },
        {
          blockType: "PARAGRAPH",
          content: { text: "Second", format: "plain" },
          position: 1,
          metadata: {},
        },
      ];

      const tiptapJson = blocksToTiptap(blocks);
      
      expect(tiptapJson.content).toHaveLength(3);
      // Blocks should be in position order
      const texts = tiptapJson.content.map(
        (node: { content?: Array<{ text?: string }> }) => 
          node.content?.[0]?.text
      );
      expect(texts).toEqual(["First", "Second", "Third"]);
    });

    it("should handle empty blocks array", () => {
      const tiptapJson = blocksToTiptap([]);
      
      expect(tiptapJson.type).toBe("doc");
      expect(tiptapJson.content).toHaveLength(0);
    });
  });

  describe("roundtrip conversion", () => {
    it("should maintain content through tiptap -> blocks -> tiptap conversion", () => {
      const originalTiptap: TiptapDoc = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
        ],
      };

      const blocks = tiptapToBlocks(originalTiptap);
      const reconverted = blocksToTiptap(blocks);

      expect(reconverted.content).toHaveLength(2);
      expect(reconverted.content[0].type).toBe("paragraph");
      expect(reconverted.content[1].type).toBe("heading");
    });
  });
});

