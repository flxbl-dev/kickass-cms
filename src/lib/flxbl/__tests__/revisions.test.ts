import { describe, it, expect } from "vitest";
import { compareRevisions } from "../revisions";
import type { ContentRevision } from "../types";

describe("Revision Utilities", () => {
  describe("compareRevisions", () => {
    const baseRevision: ContentRevision = {
      id: "rev_1",
      revisionNumber: 1,
      title: "Original Title",
      blocksSnapshot: {
        "0": { blockType: "PARAGRAPH", content: { text: "First paragraph" }, metadata: {} },
        "1": { blockType: "HEADING", content: { text: "Heading", level: 2 }, metadata: {} },
      },
      changeMessage: "Initial version",
      isCurrent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should detect title changes", () => {
      const modifiedRevision: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
        revisionNumber: 2,
        title: "Modified Title",
        isCurrent: true,
      };

      const diff = compareRevisions(baseRevision, modifiedRevision);
      
      expect(diff.titleChanged).toBe(true);
      expect(diff.blocksAdded).toBe(0);
      expect(diff.blocksRemoved).toBe(0);
      expect(diff.blocksModified).toBe(0);
    });

    it("should detect added blocks", () => {
      const revisionWithMoreBlocks: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
        revisionNumber: 2,
        blocksSnapshot: {
          "0": { blockType: "PARAGRAPH", content: { text: "First paragraph" }, metadata: {} },
          "1": { blockType: "HEADING", content: { text: "Heading", level: 2 }, metadata: {} },
          "2": { blockType: "PARAGRAPH", content: { text: "New paragraph" }, metadata: {} },
        },
        isCurrent: true,
      };

      const diff = compareRevisions(baseRevision, revisionWithMoreBlocks);
      
      expect(diff.titleChanged).toBe(false);
      expect(diff.blocksAdded).toBe(1);
      expect(diff.blocksRemoved).toBe(0);
    });

    it("should detect removed blocks", () => {
      const revisionWithFewerBlocks: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
        revisionNumber: 2,
        blocksSnapshot: {
          "0": { blockType: "PARAGRAPH", content: { text: "First paragraph" }, metadata: {} },
        },
        isCurrent: true,
      };

      const diff = compareRevisions(baseRevision, revisionWithFewerBlocks);
      
      expect(diff.titleChanged).toBe(false);
      expect(diff.blocksAdded).toBe(0);
      expect(diff.blocksRemoved).toBe(1);
    });

    it("should detect modified blocks", () => {
      const revisionWithModifiedBlock: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
        revisionNumber: 2,
        blocksSnapshot: {
          "0": { blockType: "PARAGRAPH", content: { text: "Modified paragraph" }, metadata: {} },
          "1": { blockType: "HEADING", content: { text: "Heading", level: 2 }, metadata: {} },
        },
        isCurrent: true,
      };

      const diff = compareRevisions(baseRevision, revisionWithModifiedBlock);
      
      expect(diff.titleChanged).toBe(false);
      expect(diff.blocksAdded).toBe(0);
      expect(diff.blocksRemoved).toBe(0);
      expect(diff.blocksModified).toBe(1);
    });

    it("should handle complex changes", () => {
      const complexRevision: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
        revisionNumber: 2,
        title: "New Title",
        blocksSnapshot: {
          "0": { blockType: "PARAGRAPH", content: { text: "Modified text" }, metadata: {} },
          // Position 1 removed
          "2": { blockType: "CODE", content: { code: "console.log()" }, metadata: {} },
        },
        isCurrent: true,
      };

      const diff = compareRevisions(baseRevision, complexRevision);
      
      expect(diff.titleChanged).toBe(true);
      expect(diff.blocksAdded).toBe(1); // Position 2 is new
      expect(diff.blocksRemoved).toBe(1); // Position 1 was removed
      expect(diff.blocksModified).toBe(1); // Position 0 was modified
    });

    it("should handle empty revisions", () => {
      const emptyRevision1: ContentRevision = {
        ...baseRevision,
        blocksSnapshot: {},
      };
      const emptyRevision2: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
        blocksSnapshot: {},
      };

      const diff = compareRevisions(emptyRevision1, emptyRevision2);
      
      expect(diff.titleChanged).toBe(false);
      expect(diff.blocksAdded).toBe(0);
      expect(diff.blocksRemoved).toBe(0);
      expect(diff.blocksModified).toBe(0);
    });

    it("should handle comparison with null blocksSnapshot", () => {
      const revisionWithNullSnapshot: ContentRevision = {
        ...baseRevision,
        blocksSnapshot: null as unknown as Record<string, unknown>,
      };
      const normalRevision: ContentRevision = {
        ...baseRevision,
        id: "rev_2",
      };

      // Should not throw
      const diff = compareRevisions(revisionWithNullSnapshot, normalRevision);
      
      expect(diff.blocksAdded).toBe(2); // All blocks in normalRevision are "added"
    });
  });
});

