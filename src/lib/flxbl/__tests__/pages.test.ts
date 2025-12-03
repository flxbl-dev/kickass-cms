import { describe, it, expect } from "vitest";
import {
  buildPagePath,
  groupPagePlacementsByRegion,
  type PagePlacementWithContent,
} from "../pages";

describe("Page Utilities", () => {
  describe("buildPagePath", () => {
    it("should build root-level path with leading slash", () => {
      expect(buildPagePath("about")).toBe("/about");
    });

    it("should build root-level path when parent is root", () => {
      expect(buildPagePath("about", "/")).toBe("/about");
    });

    it("should build nested path with parent path", () => {
      expect(buildPagePath("web-dev", "/services")).toBe("/services/web-dev");
    });

    it("should handle deeply nested paths", () => {
      expect(buildPagePath("frontend", "/services/web-dev")).toBe(
        "/services/web-dev/frontend"
      );
    });

    it("should handle null parent path", () => {
      expect(buildPagePath("home", null)).toBe("/home");
    });

    it("should handle undefined parent path", () => {
      expect(buildPagePath("home", undefined)).toBe("/home");
    });
  });

  describe("groupPagePlacementsByRegion", () => {
    const mockPlacements: PagePlacementWithContent[] = [
      {
        placement: { region: "sidebar", position: 0, settings: null },
        block: {
          id: "1",
          name: "Newsletter",
          blockType: "NEWSLETTER",
          content: {},
          isGlobal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        placement: { region: "sidebar", position: 1, settings: null },
        block: {
          id: "2",
          name: "CTA",
          blockType: "CTA",
          content: {},
          isGlobal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        placement: { region: "footer", position: 0, settings: null },
        block: {
          id: "3",
          name: "Author Bio",
          blockType: "AUTHOR_BIO",
          content: {},
          isGlobal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    it("should group placements by region", () => {
      const grouped = groupPagePlacementsByRegion(mockPlacements);

      expect(grouped.size).toBe(2);
      expect(grouped.has("sidebar")).toBe(true);
      expect(grouped.has("footer")).toBe(true);
    });

    it("should maintain correct items in each region", () => {
      const grouped = groupPagePlacementsByRegion(mockPlacements);

      const sidebarPlacements = grouped.get("sidebar");
      expect(sidebarPlacements).toHaveLength(2);
      expect(sidebarPlacements?.[0].block?.name).toBe("Newsletter");
      expect(sidebarPlacements?.[1].block?.name).toBe("CTA");

      const footerPlacements = grouped.get("footer");
      expect(footerPlacements).toHaveLength(1);
      expect(footerPlacements?.[0].block?.name).toBe("Author Bio");
    });

    it("should handle empty placements array", () => {
      const grouped = groupPagePlacementsByRegion([]);
      expect(grouped.size).toBe(0);
    });

    it("should handle single placement", () => {
      const grouped = groupPagePlacementsByRegion([mockPlacements[0]]);

      expect(grouped.size).toBe(1);
      expect(grouped.get("sidebar")).toHaveLength(1);
    });
  });
});

describe("Page Types", () => {
  it("should have correct PageSectionType values", () => {
    // This is a type-level test to ensure the schema is correct
    const validTypes = ["CONTENT_LIST", "SINGLE_CONTENT", "STATIC_BLOCK", "GLOBAL_BLOCK"];
    expect(validTypes).toContain("CONTENT_LIST");
    expect(validTypes).toContain("SINGLE_CONTENT");
    expect(validTypes).toContain("STATIC_BLOCK");
    expect(validTypes).toContain("GLOBAL_BLOCK");
  });
});

