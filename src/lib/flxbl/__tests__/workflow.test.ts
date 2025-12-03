import { describe, it, expect } from "vitest";
import {
  validateTransition,
  getTransitionRules,
} from "../workflow";

describe("Workflow Utilities", () => {
  describe("validateTransition", () => {
    const states = [
      {
        id: "1",
        name: "Draft",
        slug: "draft",
        color: "#gray",
        position: 0,
        allowedTransitions: ["in-review"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "In Review",
        slug: "in-review",
        color: "#yellow",
        position: 1,
        allowedTransitions: ["draft", "approved"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Approved",
        slug: "approved",
        color: "#blue",
        position: 2,
        allowedTransitions: ["in-review", "published"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        name: "Published",
        slug: "published",
        color: "#green",
        position: 3,
        allowedTransitions: ["archived"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should validate allowed transition", () => {
      const result = validateTransition("draft", "in-review", states);
      expect(result.valid).toBe(true);
    });

    it("should reject disallowed transition", () => {
      const result = validateTransition("draft", "published", states);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not allowed");
    });

    it("should reject transition from non-existent state", () => {
      const result = validateTransition("unknown", "in-review", states);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not found");
    });

    it("should reject transition to non-existent state", () => {
      const result = validateTransition("draft", "unknown", states);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not found");
    });

    it("should allow multi-step transition path", () => {
      // in-review -> approved is valid
      expect(validateTransition("in-review", "approved", states).valid).toBe(true);
      // approved -> published is valid
      expect(validateTransition("approved", "published", states).valid).toBe(true);
    });

    it("should allow backward transition when configured", () => {
      // in-review -> draft is allowed
      expect(validateTransition("in-review", "draft", states).valid).toBe(true);
      // approved -> in-review is allowed
      expect(validateTransition("approved", "in-review", states).valid).toBe(true);
    });
  });

  describe("getTransitionRules", () => {
    const states = [
      {
        id: "1",
        name: "Draft",
        slug: "draft",
        color: "#gray",
        position: 0,
        allowedTransitions: ["in-review"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "In Review",
        slug: "in-review",
        color: "#yellow",
        position: 1,
        allowedTransitions: ["draft", "approved"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("should return all available transitions for a state", () => {
      const rules = getTransitionRules("in-review", states);
      
      expect(rules).toHaveLength(2);
      expect(rules.map(r => r.targetSlug)).toContain("draft");
      expect(rules.map(r => r.targetSlug)).toContain("approved");
    });

    it("should return empty array for non-existent state", () => {
      const rules = getTransitionRules("unknown", states);
      expect(rules).toHaveLength(0);
    });

    it("should return empty array for state with no transitions", () => {
      const statesWithNoTransitions = [
        {
          id: "1",
          name: "Final",
          slug: "final",
          color: "#red",
          position: 0,
          allowedTransitions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const rules = getTransitionRules("final", statesWithNoTransitions);
      expect(rules).toHaveLength(0);
    });
  });
});

