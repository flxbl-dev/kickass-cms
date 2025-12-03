/**
 * API Contract Tests
 *
 * These tests validate that our client's request/response handling
 * matches the FLXBL API OpenAPI specification.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFlxblClient, type QueryTraversal } from "../client";
import {
  ContentSchema,
  AuthorSchema,
  MediaSchema,
  ContentBlockSchema,
  ContentRevisionSchema,
  WorkflowStateSchema,
  LayoutSchema,
  LayoutPlacementSchema,
  BlockSchema,
  PageSchema,
  PageSectionSchema,
  AuthoredByPropsSchema,
  HasMediaPropsSchema,
  HasBlockPropsSchema,
  CategorizedAsPropsSchema,
  HasStatePropsSchema,
  PageParentPropsSchema,
  PageUsesLayoutPropsSchema,
  PageHasSectionPropsSchema,
  PageFiltersCategoryPropsSchema,
  SectionHasContentPropsSchema,
} from "../types";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Contract Tests", () => {
  const client = createFlxblClient({
    baseUrl: "https://api.flxbl.dev",
    apiKey: "test-key",
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ===========================================================================
  // List Response Format Contract
  // ===========================================================================

  describe("List Response Format", () => {
    it("should correctly handle the { data, pagination } wrapper", async () => {
      // OpenAPI spec: GET /{Entity} returns { data: T[], pagination: { limit, offset, total } }
      const apiResponse = {
        data: [
          {
            id: "node_123e4567-e89b-12d3-a456-426614174000",
            title: "Test Content",
            slug: "test-content",
            contentType: "POST",
            excerpt: null,
            metadata: {},
            publishedAt: null,
            tags: [],
            tenantId: "tenant_123",
            createdAt: "2024-01-15T10:00:00.000Z",
            updatedAt: "2024-01-15T10:00:00.000Z",
          },
        ],
        pagination: {
          limit: 20,
          offset: 0,
          total: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => apiResponse,
      });

      const result = await client.list("Content");

      // Should extract data array
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("node_123e4567-e89b-12d3-a456-426614174000");
    });

    it("should handle raw array response for backwards compatibility", async () => {
      // Some API versions return raw array instead of wrapped response
      const apiResponse = [
        {
          id: "node_123e4567-e89b-12d3-a456-426614174000",
          title: "Test Content",
          slug: "test-content",
          contentType: "POST",
          createdAt: "2024-01-15T10:00:00.000Z",
          updatedAt: "2024-01-15T10:00:00.000Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => apiResponse,
      });

      const result = await client.list("Content");

      // Should handle raw array directly
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("node_123e4567-e89b-12d3-a456-426614174000");
    });

    it("should return pagination info when using listWithPagination", async () => {
      const apiResponse = {
        data: [],
        pagination: {
          limit: 10,
          offset: 20,
          total: 100,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => apiResponse,
      });

      const result = await client.listWithPagination("Content", {
        limit: 10,
        offset: 20,
      });

      expect(result.pagination.total).toBe(100);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(20);
    });
  });

  // ===========================================================================
  // Entity Schema Contract Tests
  // ===========================================================================

  describe("Entity Schema Contracts", () => {
    describe("Content entity", () => {
      it("should match OpenAPI Content schema", () => {
        // From OpenAPI spec: Content has these required fields
        const validContent = {
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => ContentSchema.parse(validContent)).not.toThrow();
      });

      it("should accept all valid contentType enum values", () => {
        const validTypes = ["PAGE", "POST", "ARTICLE"];

        for (const contentType of validTypes) {
          const content = {
            id: "node_123",
            title: "Test",
            slug: "test",
            contentType,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          };
          expect(() => ContentSchema.parse(content)).not.toThrow();
        }
      });

      it("should handle optional fields correctly", () => {
        const contentWithOptionals = {
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          excerpt: "An excerpt",
          metadata: { seo: { title: "SEO Title" } },
          publishedAt: "2024-01-15T10:00:00Z",
          tags: ["news", "featured"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = ContentSchema.parse(contentWithOptionals);
        expect(result.excerpt).toBe("An excerpt");
        expect(result.tags).toEqual(["news", "featured"]);
        expect(result.publishedAt).toBeInstanceOf(Date);
      });
    });

    describe("Author entity", () => {
      it("should match OpenAPI Author schema", () => {
        const validAuthor = {
          id: "author_123",
          name: "John Doe",
          email: "john@example.com",
          bio: "A writer",
          avatarUrl: "https://example.com/avatar.jpg",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => AuthorSchema.parse(validAuthor)).not.toThrow();
      });
    });

    describe("Media entity", () => {
      it("should match OpenAPI Media schema", () => {
        const validMedia = {
          id: "media_123",
          filename: "image.jpg",
          url: "https://cdn.example.com/image.jpg",
          mimeType: "image/jpeg",
          size: 1024000,
          alt: "Alt text",
          caption: "A caption",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => MediaSchema.parse(validMedia)).not.toThrow();
      });

      it("should require size as integer", () => {
        const media = {
          id: "media_123",
          filename: "image.jpg",
          url: "https://cdn.example.com/image.jpg",
          mimeType: "image/jpeg",
          size: 1024000,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = MediaSchema.parse(media);
        expect(typeof result.size).toBe("number");
        expect(Number.isInteger(result.size)).toBe(true);
      });
    });

    describe("ContentBlock entity", () => {
      it("should match OpenAPI ContentBlock schema", () => {
        const validBlock = {
          id: "block_123",
          blockType: "PARAGRAPH",
          content: { text: "Hello world", format: "plain" },
          position: 0,
          metadata: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => ContentBlockSchema.parse(validBlock)).not.toThrow();
      });

      it("should accept all valid blockType enum values", () => {
        const validTypes = [
          "PARAGRAPH",
          "HEADING",
          "IMAGE",
          "QUOTE",
          "CODE",
          "CALLOUT",
          "EMBED",
          "LIST",
          "DIVIDER",
        ];

        for (const blockType of validTypes) {
          const block = {
            id: "block_123",
            blockType,
            content: {},
            position: 0,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          };
          expect(() => ContentBlockSchema.parse(block)).not.toThrow();
        }
      });
    });

    describe("ContentRevision entity", () => {
      it("should match OpenAPI ContentRevision schema", () => {
        const validRevision = {
          id: "revision_123",
          revisionNumber: 1,
          title: "Revision Title",
          blocksSnapshot: { "0": { blockType: "PARAGRAPH", content: { text: "Hi" } } },
          changeMessage: "Initial version",
          isCurrent: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => ContentRevisionSchema.parse(validRevision)).not.toThrow();
      });
    });

    describe("WorkflowState entity", () => {
      it("should match OpenAPI WorkflowState schema", () => {
        const validState = {
          id: "state_123",
          name: "Draft",
          slug: "draft",
          color: "#6B7280",
          description: "Content being written",
          position: 0,
          allowedTransitions: ["in-review", "published"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => WorkflowStateSchema.parse(validState)).not.toThrow();
      });
    });

    describe("Layout entity", () => {
      it("should match OpenAPI Layout schema", () => {
        const validLayout = {
          id: "layout_123",
          name: "Single Column",
          slug: "single-column",
          description: "A simple single column layout",
          regions: { main: { name: "Main Content", maxBlocks: 10 } },
          template: "single-column",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => LayoutSchema.parse(validLayout)).not.toThrow();
      });
    });

    describe("LayoutPlacement entity", () => {
      it("should match OpenAPI LayoutPlacement schema", () => {
        const validPlacement = {
          id: "placement_123",
          region: "main",
          position: 0,
          settings: {},
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => LayoutPlacementSchema.parse(validPlacement)).not.toThrow();
      });
    });

    describe("Block entity", () => {
      it("should match OpenAPI Block schema", () => {
        const validBlock = {
          id: "gblock_123",
          name: "Author Bio Block",
          blockType: "AUTHOR_BIO",
          content: { showAvatar: true },
          isGlobal: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => BlockSchema.parse(validBlock)).not.toThrow();
      });

      it("should accept all valid global blockType enum values", () => {
        const validTypes = ["AUTHOR_BIO", "RELATED_POSTS", "NEWSLETTER", "CTA", "CUSTOM"];

        for (const blockType of validTypes) {
          const block = {
            id: "gblock_123",
            name: "Test Block",
            blockType,
            content: {},
            isGlobal: true,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          };
          expect(() => BlockSchema.parse(block)).not.toThrow();
        }
      });
    });

    describe("Page entity", () => {
      it("should match OpenAPI Page schema", () => {
        const validPage = {
          id: "page_123",
          title: "About Us",
          slug: "about",
          path: "/about",
          isPublished: true,
          showInNav: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => PageSchema.parse(validPage)).not.toThrow();
      });

      it("should handle optional fields correctly", () => {
        const pageWithOptionals = {
          id: "page_123",
          title: "Services",
          slug: "services",
          path: "/services",
          description: "Our services page",
          isPublished: true,
          showInNav: true,
          navOrder: 2,
          metadata: { seo: { title: "Services - Our Company" } },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = PageSchema.parse(pageWithOptionals);
        expect(result.description).toBe("Our services page");
        expect(result.navOrder).toBe(2);
        expect(result.metadata).toEqual({ seo: { title: "Services - Our Company" } });
      });

      it("should require boolean fields isPublished and showInNav", () => {
        const pageWithoutBooleans = {
          id: "page_123",
          title: "Test",
          slug: "test",
          path: "/test",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => PageSchema.parse(pageWithoutBooleans)).toThrow();
      });

      it("should parse ISO date strings for createdAt and updatedAt", () => {
        const page = {
          id: "page_123",
          title: "Test",
          slug: "test",
          path: "/test",
          isPublished: false,
          showInNav: false,
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-16T14:45:00Z",
        };

        const result = PageSchema.parse(page);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe("PageSection entity", () => {
      it("should match OpenAPI PageSection schema", () => {
        const validSection = {
          id: "section_123",
          name: "hero-section",
          sectionType: "CONTENT_LIST",
          position: 0,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        expect(() => PageSectionSchema.parse(validSection)).not.toThrow();
      });

      it("should accept all valid sectionType enum values", () => {
        const validTypes = ["CONTENT_LIST", "SINGLE_CONTENT", "STATIC_BLOCK"];

        for (const sectionType of validTypes) {
          const section = {
            id: "section_123",
            name: "test-section",
            sectionType,
            position: 0,
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          };
          expect(() => PageSectionSchema.parse(section)).not.toThrow();
        }
      });

      it("should handle optional config field", () => {
        const sectionWithConfig = {
          id: "section_123",
          name: "content-list",
          sectionType: "CONTENT_LIST",
          config: {
            limit: 10,
            orderBy: "publishedAt",
            orderDirection: "DESC",
          },
          position: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = PageSectionSchema.parse(sectionWithConfig);
        expect(result.config).toEqual({
          limit: 10,
          orderBy: "publishedAt",
          orderDirection: "DESC",
        });
      });

      it("should require position as integer", () => {
        const section = {
          id: "section_123",
          name: "test",
          sectionType: "STATIC_BLOCK",
          position: 5,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        const result = PageSectionSchema.parse(section);
        expect(typeof result.position).toBe("number");
        expect(Number.isInteger(result.position)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Relationship Property Schema Contract Tests
  // ===========================================================================

  describe("Relationship Property Contracts", () => {
    describe("AUTHORED_BY properties", () => {
      it("should require role field", () => {
        expect(() => AuthoredByPropsSchema.parse({ byline: "test" })).toThrow();
        expect(() =>
          AuthoredByPropsSchema.parse({ role: "PRIMARY" })
        ).not.toThrow();
      });

      it("should accept valid role enum values", () => {
        const validRoles = ["PRIMARY", "CONTRIBUTOR", "EDITOR"];
        for (const role of validRoles) {
          expect(() => AuthoredByPropsSchema.parse({ role })).not.toThrow();
        }
      });
    });

    describe("HAS_MEDIA properties", () => {
      it("should require role field", () => {
        expect(() => HasMediaPropsSchema.parse({ position: 0 })).toThrow();
        expect(() =>
          HasMediaPropsSchema.parse({ role: "FEATURED" })
        ).not.toThrow();
      });

      it("should accept valid role enum values", () => {
        const validRoles = ["FEATURED", "GALLERY", "INLINE", "ATTACHMENT"];
        for (const role of validRoles) {
          expect(() => HasMediaPropsSchema.parse({ role })).not.toThrow();
        }
      });
    });

    describe("HAS_BLOCK properties", () => {
      it("should require position field", () => {
        expect(() => HasBlockPropsSchema.parse({})).toThrow();
        expect(() => HasBlockPropsSchema.parse({ position: 0 })).not.toThrow();
      });
    });

    describe("CATEGORIZED_AS properties", () => {
      it("should allow all optional fields", () => {
        expect(() => CategorizedAsPropsSchema.parse({})).not.toThrow();
        expect(() =>
          CategorizedAsPropsSchema.parse({ featured: true, position: 1 })
        ).not.toThrow();
      });
    });

    describe("HAS_STATE properties", () => {
      it("should require assignedAt field", () => {
        expect(() => HasStatePropsSchema.parse({ assignedBy: "admin" })).toThrow();
        expect(() =>
          HasStatePropsSchema.parse({ assignedAt: "2024-01-01T00:00:00Z" })
        ).not.toThrow();
      });
    });

    describe("PAGE_PARENT properties", () => {
      it("should accept empty object (no properties required)", () => {
        expect(() => PageParentPropsSchema.parse({})).not.toThrow();
      });
    });

    describe("PAGE_USES_LAYOUT properties", () => {
      it("should accept empty object (no properties required)", () => {
        expect(() => PageUsesLayoutPropsSchema.parse({})).not.toThrow();
      });
    });

    describe("PAGE_HAS_SECTION properties", () => {
      it("should accept empty object (no properties required)", () => {
        expect(() => PageHasSectionPropsSchema.parse({})).not.toThrow();
      });
    });

    describe("PAGE_FILTERS_CATEGORY properties", () => {
      it("should accept empty object (no properties required)", () => {
        expect(() => PageFiltersCategoryPropsSchema.parse({})).not.toThrow();
      });
    });

    describe("SECTION_HAS_CONTENT properties", () => {
      it("should allow all optional fields", () => {
        expect(() => SectionHasContentPropsSchema.parse({})).not.toThrow();
        expect(() =>
          SectionHasContentPropsSchema.parse({ position: 0 })
        ).not.toThrow();
        expect(() =>
          SectionHasContentPropsSchema.parse({ position: 5 })
        ).not.toThrow();
      });
    });
  });

  // ===========================================================================
  // Query DSL Contract Tests
  // ===========================================================================

  describe("Query DSL Contract", () => {
    it("should support all documented filter operators", async () => {
      const queryWithAllOperators = {
        where: {
          $and: [
            { field1: { $eq: "value" } },
            { field2: { $ne: "other" } },
            { field3: { $gt: 10 } },
            { field4: { $gte: 5 } },
            { field5: { $lt: 100 } },
            { field6: { $lte: 50 } },
            { field7: { $in: ["a", "b", "c"] } },
            { field8: { $nin: ["x", "y"] } },
            { field9: { $contains: "substring" } },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", queryWithAllOperators);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/query"),
        expect.objectContaining({
          body: JSON.stringify(queryWithAllOperators),
        })
      );
    });

    it("should support $or operator", async () => {
      const queryWithOr = {
        where: {
          $or: [
            { contentType: { $eq: "POST" } },
            { contentType: { $eq: "ARTICLE" } },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", queryWithOr);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(queryWithOr),
        })
      );
    });

    it("should support traverse projection with include", async () => {
      const traverseWithInclude: QueryTraversal = {
        relationship: "AUTHORED_BY",
        direction: "out",
        include: true,
        limit: 10,
        offset: 0,
        orderBy: "createdAt",
        orderDirection: "DESC",
      };

      const queryOptions = {
        traverse: [traverseWithInclude],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", queryOptions);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody.traverse[0].include).toBe(true);
      expect(sentBody.traverse[0].limit).toBe(10);
      expect(sentBody.traverse[0].orderBy).toBe("createdAt");
      expect(sentBody.traverse[0].orderDirection).toBe("DESC");
    });

    it("should support nested traverse for multi-hop queries", async () => {
      const nestedTraverse: QueryTraversal = {
        relationship: "AUTHORED_BY",
        direction: "out",
        traverse: [
          {
            relationship: "HAS_MEDIA",
            direction: "out",
            where: { role: { $eq: "FEATURED" } },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", { traverse: [nestedTraverse] });

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody.traverse[0].traverse).toHaveLength(1);
      expect(sentBody.traverse[0].traverse[0].relationship).toBe("HAS_MEDIA");
    });

    it("should support select for field projection", async () => {
      const queryWithSelect = {
        select: ["id", "title", "slug"],
        limit: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", queryWithSelect);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(fetchOptions.body);

      expect(sentBody.select).toEqual(["id", "title", "slug"]);
    });
  });

  // ===========================================================================
  // Relationship Request/Response Format Contract
  // ===========================================================================

  describe("Relationship API Contract", () => {
    describe("Create relationship request format", () => {
      it("should send targetId and properties in request body", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            relationship: { type: "AUTHORED_BY", properties: { role: "PRIMARY" } },
            target: { id: "author_123" },
          }),
        });

        await client.createRelationship(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "author_123",
          { role: "PRIMARY", byline: "By John" }
        );

        const [, fetchOptions] = mockFetch.mock.calls[0];
        const sentBody = JSON.parse(fetchOptions.body);

        expect(sentBody).toEqual({
          targetId: "author_123",
          properties: { role: "PRIMARY", byline: "By John" },
        });
      });
    });

    describe("Get relationships response format", () => {
      it("should parse array of { relationship, target } objects", async () => {
        const apiResponse = [
          {
            relationship: {
              id: "rel_123",
              type: "AUTHORED_BY",
              properties: {
                role: "PRIMARY",
                byline: "By Author",
                tenantId: "tenant_123",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
            target: {
              id: "author_123",
              name: "John Doe",
              email: "john@example.com",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => apiResponse,
        });

        const result = await client.getRelationships(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "out",
          "Author"
        );

        expect(result).toHaveLength(1);
        expect(result[0].relationship.type).toBe("AUTHORED_BY");
        expect(result[0].relationship.properties.role).toBe("PRIMARY");
        expect(result[0].target.name).toBe("John Doe");
      });
    });

    describe("Update relationship request format", () => {
      it("should send properties wrapped in { properties } object", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            relationship: { type: "AUTHORED_BY", properties: { role: "EDITOR" } },
            target: { id: "author_123" },
          }),
        });

        await client.updateRelationship(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "author_123",
          { role: "EDITOR" }
        );

        const [, fetchOptions] = mockFetch.mock.calls[0];
        const sentBody = JSON.parse(fetchOptions.body);

        expect(sentBody).toEqual({
          properties: { role: "EDITOR" },
        });
      });
    });
  });

  // ===========================================================================
  // URL Pattern Contract Tests
  // ===========================================================================

  describe("URL Pattern Contract", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { limit: 20, offset: 0, total: 0 } }),
      });
    });

    it("should use correct base path: /api/v1/dynamic", async () => {
      await client.list("Content");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content",
        expect.any(Object)
      );
    });

    it("should use case-sensitive entity names in URLs", async () => {
      await client.list("ContentBlock");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/ContentBlock",
        expect.any(Object)
      );
    });

    it("should format GET entity by ID URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      await client.get("Content", "node_123");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/node_123",
        expect.any(Object)
      );
    });

    it("should format query endpoint URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", { where: {} });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/query",
        expect.any(Object)
      );
    });

    it("should format relationship create URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          relationship: { type: "AUTHORED_BY", properties: { role: "PRIMARY" } },
          target: {},
        }),
      });

      await client.createRelationship(
        "Content",
        "node_123",
        "AUTHORED_BY",
        "author_456",
        { role: "PRIMARY" }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY",
        expect.any(Object)
      );
    });

    it("should format relationship get URL with direction parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.getRelationships("Content", "node_123", "AUTHORED_BY", "both");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY?direction=both",
        expect.any(Object)
      );
    });

    it("should format relationship update URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          relationship: { type: "AUTHORED_BY", properties: {} },
          target: {},
        }),
      });

      await client.updateRelationship(
        "Content",
        "node_123",
        "AUTHORED_BY",
        "author_456",
        { role: "EDITOR" }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY/author_456",
        expect.any(Object)
      );
    });

    it("should format relationship delete URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteRelationship(
        "Content",
        "node_123",
        "AUTHORED_BY",
        "author_456"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY/author_456",
        expect.any(Object)
      );
    });

    it("should use correct URL for Page entity", async () => {
      await client.list("Page");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Page",
        expect.any(Object)
      );
    });

    it("should use correct URL for PageSection entity", async () => {
      await client.list("PageSection");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/PageSection",
        expect.any(Object)
      );
    });

    it("should format Page relationship URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.getRelationships("Page", "page_123", "PAGE_PARENT", "out");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Page/page_123/relationships/PAGE_PARENT?direction=out",
        expect.any(Object)
      );
    });

    it("should format PageSection relationship URL correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.getRelationships("PageSection", "section_123", "SECTION_HAS_CONTENT", "out");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/PageSection/section_123/relationships/SECTION_HAS_CONTENT?direction=out",
        expect.any(Object)
      );
    });
  });

  // ===========================================================================
  // HTTP Method Contract Tests
  // ===========================================================================

  describe("HTTP Method Contract", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { limit: 20, offset: 0, total: 0 } }),
      });
    });

    it("should use GET for list operations", async () => {
      await client.list("Content");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should use GET for get by ID operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      await client.get("Content", "node_123");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should use POST for create operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      await client.create("Content", {
        title: "Test",
        slug: "test",
        contentType: "POST",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should use PUT for full update operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      await client.update("Content", "node_123", { title: "Updated" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should use PATCH for partial update operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "node_123",
          title: "Test",
          slug: "test",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        }),
      });

      await client.patch("Content", "node_123", { title: "Patched" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should use DELETE for delete operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.delete("Content", "node_123");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should use POST for query operations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", { where: {} });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});

