import { describe, it, expect } from "vitest";
import {
  whereSlug,
  whereHasTag,
  whereContentType,
  traverseAuthors,
  traverseMedia,
  traverseCategories,
  traverseBlocks,
  traverseState,
} from "../queries";

describe("Query Builder Helpers", () => {
  describe("whereSlug", () => {
    it("should build slug filter", () => {
      const result = whereSlug("my-article");
      expect(result).toEqual({ slug: { $eq: "my-article" } });
    });

    it("should handle slugs with special characters", () => {
      const result = whereSlug("2024-01-15-new-post");
      expect(result).toEqual({ slug: { $eq: "2024-01-15-new-post" } });
    });
  });

  describe("whereHasTag", () => {
    it("should build tag contains filter", () => {
      const result = whereHasTag("featured");
      expect(result).toEqual({ tags: { $contains: "featured" } });
    });
  });

  describe("whereContentType", () => {
    it("should build content type filter for PAGE", () => {
      const result = whereContentType("PAGE");
      expect(result).toEqual({ contentType: { $eq: "PAGE" } });
    });

    it("should build content type filter for POST", () => {
      const result = whereContentType("POST");
      expect(result).toEqual({ contentType: { $eq: "POST" } });
    });

    it("should build content type filter for ARTICLE", () => {
      const result = whereContentType("ARTICLE");
      expect(result).toEqual({ contentType: { $eq: "ARTICLE" } });
    });
  });
});

describe("Traversal Builders", () => {
  describe("traverseAuthors", () => {
    it("should build basic author traversal", () => {
      const result = traverseAuthors();
      expect(result).toEqual({
        relationship: "AUTHORED_BY",
        direction: "out",
      });
    });

    it("should build author traversal with PRIMARY role filter", () => {
      const result = traverseAuthors("PRIMARY");
      expect(result).toEqual({
        relationship: "AUTHORED_BY",
        direction: "out",
        where: { role: { $eq: "PRIMARY" } },
      });
    });

    it("should build author traversal with CONTRIBUTOR role filter", () => {
      const result = traverseAuthors("CONTRIBUTOR");
      expect(result).toEqual({
        relationship: "AUTHORED_BY",
        direction: "out",
        where: { role: { $eq: "CONTRIBUTOR" } },
      });
    });

    it("should build author traversal with EDITOR role filter", () => {
      const result = traverseAuthors("EDITOR");
      expect(result).toEqual({
        relationship: "AUTHORED_BY",
        direction: "out",
        where: { role: { $eq: "EDITOR" } },
      });
    });
  });

  describe("traverseMedia", () => {
    it("should build basic media traversal", () => {
      const result = traverseMedia();
      expect(result).toEqual({
        relationship: "HAS_MEDIA",
        direction: "out",
      });
    });

    it("should build media traversal with FEATURED role filter", () => {
      const result = traverseMedia("FEATURED");
      expect(result).toEqual({
        relationship: "HAS_MEDIA",
        direction: "out",
        where: { role: { $eq: "FEATURED" } },
      });
    });

    it("should build media traversal with GALLERY role filter", () => {
      const result = traverseMedia("GALLERY");
      expect(result).toEqual({
        relationship: "HAS_MEDIA",
        direction: "out",
        where: { role: { $eq: "GALLERY" } },
      });
    });

    it("should build media traversal with INLINE role filter", () => {
      const result = traverseMedia("INLINE");
      expect(result).toEqual({
        relationship: "HAS_MEDIA",
        direction: "out",
        where: { role: { $eq: "INLINE" } },
      });
    });

    it("should build media traversal with ATTACHMENT role filter", () => {
      const result = traverseMedia("ATTACHMENT");
      expect(result).toEqual({
        relationship: "HAS_MEDIA",
        direction: "out",
        where: { role: { $eq: "ATTACHMENT" } },
      });
    });
  });

  describe("traverseCategories", () => {
    it("should build basic category traversal", () => {
      const result = traverseCategories();
      expect(result).toEqual({
        relationship: "CATEGORIZED_AS",
        direction: "out",
      });
    });

    it("should build category traversal with featured filter", () => {
      const result = traverseCategories(true);
      expect(result).toEqual({
        relationship: "CATEGORIZED_AS",
        direction: "out",
        where: { featured: { $eq: true } },
      });
    });

    it("should not add filter when featuredOnly is false", () => {
      const result = traverseCategories(false);
      expect(result).toEqual({
        relationship: "CATEGORIZED_AS",
        direction: "out",
      });
    });
  });

  describe("traverseBlocks", () => {
    it("should build block traversal", () => {
      const result = traverseBlocks();
      expect(result).toEqual({
        relationship: "HAS_BLOCK",
        direction: "out",
      });
    });
  });

  describe("traverseState", () => {
    it("should build workflow state traversal", () => {
      const result = traverseState();
      expect(result).toEqual({
        relationship: "HAS_STATE",
        direction: "out",
      });
    });
  });
});

describe("Query DSL Integration", () => {
  it("should combine where clauses with $and", () => {
    const slugFilter = whereSlug("hello-world");
    const tagFilter = whereHasTag("news");

    const combined = {
      $and: [slugFilter, tagFilter],
    };

    expect(combined).toEqual({
      $and: [
        { slug: { $eq: "hello-world" } },
        { tags: { $contains: "news" } },
      ],
    });
  });

  it("should build complex query with traversal", () => {
    const query = {
      where: whereContentType("POST"),
      traverse: [traverseAuthors("PRIMARY"), traverseMedia("FEATURED"), traverseState()],
      limit: 10,
      orderBy: "publishedAt",
      orderDirection: "DESC" as const,
    };

    expect(query).toEqual({
      where: { contentType: { $eq: "POST" } },
      traverse: [
        {
          relationship: "AUTHORED_BY",
          direction: "out",
          where: { role: { $eq: "PRIMARY" } },
        },
        {
          relationship: "HAS_MEDIA",
          direction: "out",
          where: { role: { $eq: "FEATURED" } },
        },
        {
          relationship: "HAS_STATE",
          direction: "out",
        },
      ],
      limit: 10,
      orderBy: "publishedAt",
      orderDirection: "DESC",
    });
  });
});
