import { describe, it, expect } from "vitest";
import {
  ContentSchema,
  AuthorSchema,
  CategorySchema,
  MediaSchema,
  ContentBlockSchema,
  WorkflowStateSchema,
  CreateContentSchema,
  ContentTypeSchema,
  BlockTypeSchema,
  AuthorRoleSchema,
  MediaRoleSchema,
  AuthoredByPropsSchema,
  CategorizedAsPropsSchema,
  HasMediaPropsSchema,
  HasBlockPropsSchema,
  HasStatePropsSchema,
} from "../types";

describe("Entity Schemas", () => {
  describe("ContentSchema", () => {
    it("should parse valid content", () => {
      const validContent = {
        id: "node_123",
        title: "Test Post",
        slug: "test-post",
        excerpt: "This is a test excerpt",
        contentType: "POST",
        metadata: { seo: { title: "SEO Title" } },
        publishedAt: "2024-01-15T10:00:00Z",
        tags: ["news", "featured"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      };

      const result = ContentSchema.parse(validContent);
      expect(result.id).toBe("node_123");
      expect(result.title).toBe("Test Post");
      expect(result.excerpt).toBe("This is a test excerpt");
      expect(result.tags).toEqual(["news", "featured"]);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it("should parse content with null optional fields", () => {
      const minimalContent = {
        id: "node_123",
        title: "Test",
        slug: "test",
        contentType: "PAGE",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = ContentSchema.parse(minimalContent);
      expect(result.excerpt).toBeUndefined();
      expect(result.metadata).toBeUndefined();
      expect(result.tags).toBeUndefined();
    });

    it("should reject invalid content type", () => {
      const invalidContent = {
        id: "node_123",
        title: "Test",
        slug: "test",
        contentType: "INVALID_TYPE",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(() => ContentSchema.parse(invalidContent)).toThrow();
    });
  });

  describe("AuthorSchema", () => {
    it("should parse valid author", () => {
      const validAuthor = {
        id: "node_456",
        name: "John Doe",
        email: "john@example.com",
        bio: "A writer",
        avatarUrl: "https://example.com/avatar.jpg",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = AuthorSchema.parse(validAuthor);
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
    });

    it("should reject author without required fields", () => {
      const invalidAuthor = {
        id: "node_456",
        name: "John Doe",
        // missing email
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(() => AuthorSchema.parse(invalidAuthor)).toThrow();
    });
  });

  describe("CategorySchema", () => {
    it("should parse category (hierarchy managed via CATEGORY_PARENT relationship)", () => {
      const category = {
        id: "node_789",
        name: "Technology",
        slug: "technology",
        description: "Tech articles",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = CategorySchema.parse(category);
      expect(result.name).toBe("Technology");
      expect(result.slug).toBe("technology");
      expect(result.description).toBe("Tech articles");
    });
  });

  describe("MediaSchema", () => {
    it("should parse valid media", () => {
      const media = {
        id: "node_media_1",
        filename: "hero.jpg",
        url: "https://cdn.example.com/hero.jpg",
        mimeType: "image/jpeg",
        size: 1024000,
        alt: "Hero image",
        caption: "A beautiful hero image",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = MediaSchema.parse(media);
      expect(result.size).toBe(1024000);
      expect(result.mimeType).toBe("image/jpeg");
    });
  });

  describe("ContentBlockSchema", () => {
    it("should parse valid content block", () => {
      const block = {
        id: "block_1",
        blockType: "PARAGRAPH",
        content: { text: "Hello world", format: "plain" },
        position: 0,
        metadata: {},
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = ContentBlockSchema.parse(block);
      expect(result.blockType).toBe("PARAGRAPH");
      expect(result.position).toBe(0);
    });

    it("should reject invalid block type", () => {
      const invalidBlock = {
        id: "block_1",
        blockType: "INVALID_BLOCK",
        content: {},
        position: 0,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(() => ContentBlockSchema.parse(invalidBlock)).toThrow();
    });
  });

  describe("WorkflowStateSchema", () => {
    it("should parse valid workflow state", () => {
      const state = {
        id: "state_1",
        name: "Draft",
        slug: "draft",
        color: "#6B7280",
        description: "Content being written",
        position: 0,
        allowedTransitions: ["in-review"],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const result = WorkflowStateSchema.parse(state);
      expect(result.name).toBe("Draft");
      expect(result.allowedTransitions).toEqual(["in-review"]);
    });
  });
});

describe("Create DTOs", () => {
  describe("CreateContentSchema", () => {
    it("should validate create content without id/timestamps", () => {
      const createData = {
        title: "New Post",
        slug: "new-post",
        excerpt: "Content excerpt",
        contentType: "POST",
        tags: ["test"],
      };

      const result = CreateContentSchema.parse(createData);
      expect(result.title).toBe("New Post");
      expect((result as Record<string, unknown>).id).toBeUndefined();
    });
  });
});

describe("Enum Schemas", () => {
  describe("ContentTypeSchema", () => {
    it("should accept valid content types", () => {
      expect(ContentTypeSchema.parse("PAGE")).toBe("PAGE");
      expect(ContentTypeSchema.parse("POST")).toBe("POST");
      expect(ContentTypeSchema.parse("ARTICLE")).toBe("ARTICLE");
    });

    it("should reject invalid content type", () => {
      expect(() => ContentTypeSchema.parse("INVALID")).toThrow();
    });
  });

  describe("BlockTypeSchema", () => {
    it("should accept valid block types", () => {
      expect(BlockTypeSchema.parse("PARAGRAPH")).toBe("PARAGRAPH");
      expect(BlockTypeSchema.parse("HEADING")).toBe("HEADING");
      expect(BlockTypeSchema.parse("IMAGE")).toBe("IMAGE");
      expect(BlockTypeSchema.parse("QUOTE")).toBe("QUOTE");
      expect(BlockTypeSchema.parse("CODE")).toBe("CODE");
      expect(BlockTypeSchema.parse("CALLOUT")).toBe("CALLOUT");
    });

    it("should reject invalid block type", () => {
      expect(() => BlockTypeSchema.parse("INVALID")).toThrow();
    });
  });

  describe("AuthorRoleSchema", () => {
    it("should accept valid author roles", () => {
      expect(AuthorRoleSchema.parse("PRIMARY")).toBe("PRIMARY");
      expect(AuthorRoleSchema.parse("CONTRIBUTOR")).toBe("CONTRIBUTOR");
      expect(AuthorRoleSchema.parse("EDITOR")).toBe("EDITOR");
    });
  });

  describe("MediaRoleSchema", () => {
    it("should accept valid media roles", () => {
      expect(MediaRoleSchema.parse("FEATURED")).toBe("FEATURED");
      expect(MediaRoleSchema.parse("GALLERY")).toBe("GALLERY");
      expect(MediaRoleSchema.parse("INLINE")).toBe("INLINE");
      expect(MediaRoleSchema.parse("ATTACHMENT")).toBe("ATTACHMENT");
    });
  });
});

describe("Relationship Property Schemas", () => {
  describe("AuthoredByPropsSchema", () => {
    it("should parse valid authored_by props with role", () => {
      const props = {
        role: "PRIMARY",
        byline: "By John Doe",
      };

      const result = AuthoredByPropsSchema.parse(props);
      expect(result.role).toBe("PRIMARY");
      expect(result.byline).toBe("By John Doe");
    });

    it("should require role field", () => {
      const invalidProps = {
        byline: "By John Doe",
      };

      expect(() => AuthoredByPropsSchema.parse(invalidProps)).toThrow();
    });
  });

  describe("CategorizedAsPropsSchema", () => {
    it("should parse valid categorized_as props", () => {
      const props = {
        featured: true,
        position: 1,
      };

      const result = CategorizedAsPropsSchema.parse(props);
      expect(result.featured).toBe(true);
      expect(result.position).toBe(1);
    });

    it("should allow empty props (all optional)", () => {
      const result = CategorizedAsPropsSchema.parse({});
      expect(result.featured).toBeUndefined();
      expect(result.position).toBeUndefined();
    });
  });

  describe("HasMediaPropsSchema", () => {
    it("should parse valid has_media props", () => {
      const props = {
        role: "FEATURED",
        position: 0,
        caption: "Featured image caption",
      };

      const result = HasMediaPropsSchema.parse(props);
      expect(result.role).toBe("FEATURED");
      expect(result.position).toBe(0);
      expect(result.caption).toBe("Featured image caption");
    });

    it("should require role field", () => {
      const invalidProps = {
        position: 1,
      };

      expect(() => HasMediaPropsSchema.parse(invalidProps)).toThrow();
    });
  });

  describe("HasBlockPropsSchema", () => {
    it("should parse valid has_block props", () => {
      const props = {
        position: 5,
      };

      const result = HasBlockPropsSchema.parse(props);
      expect(result.position).toBe(5);
    });

    it("should require position field", () => {
      expect(() => HasBlockPropsSchema.parse({})).toThrow();
    });
  });

  describe("HasStatePropsSchema", () => {
    it("should parse valid has_state props", () => {
      const props = {
        assignedAt: "2024-01-15T10:00:00Z",
        assignedBy: "admin",
      };

      const result = HasStatePropsSchema.parse(props);
      expect(result.assignedAt).toBeInstanceOf(Date);
      expect(result.assignedBy).toBe("admin");
    });
  });
});
