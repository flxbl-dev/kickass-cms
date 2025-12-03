import { describe, it, expect } from "vitest";
import {
  extractPageMetadata,
  extractContentMetadata,
  generatePageMetadata,
  generateContentMetadata,
  getDefaultMetadata,
} from "../metadata";
import type { Page, Content } from "../types";

describe("Metadata Utilities", () => {
  describe("extractPageMetadata", () => {
    it("should extract metadata from page with metadata field", () => {
      const page: Page = {
        id: "1",
        title: "Test Page",
        slug: "test",
        path: "/test",
        description: "A test page",
        isPublished: true,
        showInNav: true,
        navOrder: 0,
        metadata: {
          "og:title": "Custom OG Title",
          "og:description": "Custom OG Description",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const meta = extractPageMetadata(page);
      expect(meta["og:title"]).toBe("Custom OG Title");
      expect(meta["og:description"]).toBe("Custom OG Description");
    });

    it("should return empty object when metadata is null", () => {
      const page: Page = {
        id: "1",
        title: "Test Page",
        slug: "test",
        path: "/test",
        description: null,
        isPublished: true,
        showInNav: true,
        navOrder: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const meta = extractPageMetadata(page);
      expect(meta).toEqual({});
    });
  });

  describe("extractContentMetadata", () => {
    it("should extract metadata from content with metadata field", () => {
      const content: Content = {
        id: "1",
        title: "Test Content",
        slug: "test-content",
        excerpt: "Test excerpt",
        contentType: "POST",
        publishedAt: new Date(),
        tags: ["test"],
        metadata: {
          "og:image": "https://example.com/image.jpg",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const meta = extractContentMetadata(content);
      expect(meta["og:image"]).toBe("https://example.com/image.jpg");
    });

    it("should return empty object when metadata is null", () => {
      const content: Content = {
        id: "1",
        title: "Test Content",
        slug: "test-content",
        excerpt: null,
        contentType: "POST",
        publishedAt: null,
        tags: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const meta = extractContentMetadata(content);
      expect(meta).toEqual({});
    });
  });

  describe("generatePageMetadata", () => {
    const basePage: Page = {
      id: "1",
      title: "Test Page",
      slug: "test",
      path: "/test",
      description: "A test page description",
      isPublished: true,
      showInNav: true,
      navOrder: 0,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should generate metadata with title", () => {
      const metadata = generatePageMetadata({ page: basePage });
      expect(metadata.title).toBe("Test Page | Kickass CMS");
    });

    it("should generate metadata with description", () => {
      const metadata = generatePageMetadata({ page: basePage });
      expect(metadata.description).toBe("A test page description");
    });

    it("should include Open Graph metadata", () => {
      const metadata = generatePageMetadata({ page: basePage });
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe("Test Page");
      expect((metadata.openGraph as { type?: string })?.type).toBe("website");
    });

    it("should include Twitter Card metadata", () => {
      const metadata = generatePageMetadata({ page: basePage });
      expect(metadata.twitter).toBeDefined();
      expect((metadata.twitter as { card?: string })?.card).toBe("summary_large_image");
    });

    it("should use custom site name", () => {
      const metadata = generatePageMetadata({
        page: basePage,
        siteName: "My Site",
      });
      expect(metadata.title).toBe("Test Page | My Site");
    });

    it("should use og:title from metadata if available", () => {
      const pageWithMeta: Page = {
        ...basePage,
        metadata: {
          "og:title": "Custom Title",
        },
      };
      const metadata = generatePageMetadata({ page: pageWithMeta });
      expect(metadata.openGraph?.title).toBe("Custom Title");
    });

    it("should include og:image when present in metadata", () => {
      const pageWithImage: Page = {
        ...basePage,
        metadata: {
          "og:image": "https://example.com/image.jpg",
        },
      };
      const metadata = generatePageMetadata({ page: pageWithImage });
      expect(metadata.openGraph?.images).toEqual([
        { url: "https://example.com/image.jpg" },
      ]);
    });
  });

  describe("generateContentMetadata", () => {
    const baseContent: Content = {
      id: "1",
      title: "Test Post",
      slug: "test-post",
      excerpt: "A test post excerpt",
      contentType: "POST",
      publishedAt: new Date("2024-01-15"),
      tags: ["test", "blog"],
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should generate metadata with title", () => {
      const metadata = generateContentMetadata({ content: baseContent });
      expect(metadata.title).toBe("Test Post | Kickass CMS");
    });

    it("should generate metadata with excerpt as description", () => {
      const metadata = generateContentMetadata({ content: baseContent });
      expect(metadata.description).toBe("A test post excerpt");
    });

    it("should set type to article for content", () => {
      const metadata = generateContentMetadata({ content: baseContent });
      expect((metadata.openGraph as { type?: string })?.type).toBe("article");
    });

    it("should include publishedTime", () => {
      const metadata = generateContentMetadata({ content: baseContent });
      expect((metadata.openGraph as { publishedTime?: string })?.publishedTime).toBeDefined();
    });

    it("should use tags as keywords", () => {
      const metadata = generateContentMetadata({ content: baseContent });
      expect(metadata.keywords).toEqual(["test", "blog"]);
    });

    it("should use featured image URL when provided", () => {
      const metadata = generateContentMetadata({
        content: baseContent,
        featuredImageUrl: "https://example.com/featured.jpg",
      });
      expect(metadata.openGraph?.images).toEqual([
        { url: "https://example.com/featured.jpg" },
      ]);
    });

    it("should prefer metadata og:image over featured image", () => {
      const contentWithMeta: Content = {
        ...baseContent,
        metadata: {
          "og:image": "https://example.com/og-image.jpg",
        },
      };
      const metadata = generateContentMetadata({
        content: contentWithMeta,
        featuredImageUrl: "https://example.com/featured.jpg",
      });
      expect(metadata.openGraph?.images).toEqual([
        { url: "https://example.com/og-image.jpg" },
      ]);
    });

    it("should use custom base path", () => {
      const metadata = generateContentMetadata({
        content: baseContent,
        basePath: "/articles",
      });
      expect(metadata.openGraph?.url).toContain("/articles/test-post");
    });
  });

  describe("getDefaultMetadata", () => {
    it("should return default metadata", () => {
      const metadata = getDefaultMetadata();
      expect(metadata.title).toBe("Kickass CMS");
      expect(metadata.description).toBe(
        "A modern content management system powered by FLXBL"
      );
    });

    it("should use custom site name", () => {
      const metadata = getDefaultMetadata("My Custom CMS");
      expect(metadata.title).toBe("My Custom CMS");
      expect(metadata.openGraph?.title).toBe("My Custom CMS");
    });

    it("should include Open Graph metadata", () => {
      const metadata = getDefaultMetadata();
      expect(metadata.openGraph).toBeDefined();
      expect((metadata.openGraph as { type?: string })?.type).toBe("website");
    });

    it("should include Twitter Card metadata", () => {
      const metadata = getDefaultMetadata();
      expect(metadata.twitter).toBeDefined();
      expect((metadata.twitter as { card?: string })?.card).toBe("summary_large_image");
    });
  });
});

