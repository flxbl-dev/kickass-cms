import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFlxblClient, FlxblError } from "../client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("FLXBL Client Integration", () => {
  const config = {
    baseUrl: "https://api.flxbl.dev",
    apiKey: "test-api-key",
  };

  let client: ReturnType<typeof createFlxblClient>;

  beforeEach(() => {
    client = createFlxblClient(config);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Entity CRUD Operations
  // ===========================================================================

  describe("Entity CRUD Operations", () => {
    describe("list()", () => {
      it("should list entities with pagination wrapper", async () => {
        const mockResponse = {
          data: [
            {
              id: "node_123",
              title: "Test Content",
              slug: "test-content",
              contentType: "POST",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
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
          json: async () => mockResponse,
        });

        const result = await client.list("Content");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content",
          expect.objectContaining({
            method: "GET",
            headers: {
              Authorization: "Bearer test-api-key",
            },
          })
        );
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("Test Content");
      });

      it("should handle raw array response (backwards compatibility)", async () => {
        // Some API versions may return a raw array instead of wrapped
        const mockResponse = [
          {
            id: "node_123",
            title: "Test Content",
            slug: "test-content",
            contentType: "POST",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const result = await client.list("Content");

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("Test Content");
      });

      it("should pass pagination query parameters", async () => {
        const mockResponse = {
          data: [],
          pagination: { limit: 10, offset: 20, total: 100 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        await client.list("Content", {
          limit: 10,
          offset: 20,
          orderBy: "createdAt",
          orderDirection: "DESC",
        });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content?limit=10&offset=20&orderBy=createdAt&orderDirection=DESC",
          expect.any(Object)
        );
      });

      it("should return pagination info with listWithPagination", async () => {
        const mockResponse = {
          data: [
            {
              id: "node_123",
              title: "Test",
              slug: "test",
              contentType: "POST",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          ],
          pagination: { limit: 10, offset: 0, total: 50 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const result = await client.listWithPagination("Content", { limit: 10 });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.total).toBe(50);
        expect(result.pagination.limit).toBe(10);
      });

      it("should synthesize pagination for raw array in listWithPagination", async () => {
        // When API returns raw array, synthesize pagination info
        const mockResponse = [
          {
            id: "node_123",
            title: "Test",
            slug: "test",
            contentType: "POST",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const result = await client.listWithPagination("Content", { limit: 10, offset: 5 });

        expect(result.data).toHaveLength(1);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.offset).toBe(5);
        expect(result.pagination.total).toBe(1); // Synthesized from array length
      });
    });

    describe("get()", () => {
      it("should get a single entity by ID", async () => {
        const mockEntity = {
          id: "node_123",
          title: "Test Content",
          slug: "test-content",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockEntity,
        });

        const result = await client.get("Content", "node_123");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123",
          expect.objectContaining({
            method: "GET",
            headers: {
              Authorization: "Bearer test-api-key",
            },
          })
        );
        expect(result.id).toBe("node_123");
        expect(result.title).toBe("Test Content");
      });

      it("should throw FlxblError for 404", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: "Entity not found" }),
        });

        await expect(client.get("Content", "nonexistent")).rejects.toThrow(
          FlxblError
        );
      });
    });

    describe("create()", () => {
      it("should create a new entity", async () => {
        const createData = {
          title: "New Post",
          slug: "new-post",
          contentType: "POST" as const,
        };

        const mockResponse = {
          id: "node_456",
          ...createData,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockResponse,
        });

        const result = await client.create("Content", createData);

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content",
          expect.objectContaining({
            method: "POST",
            headers: {
              Authorization: "Bearer test-api-key",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(createData),
          })
        );
        expect(result.id).toBe("node_456");
      });

      it("should validate create data before sending", async () => {
        const invalidData = {
          title: "Test",
          // missing required slug and contentType
        };

        // Should throw validation error before making request
        await expect(
          client.create("Content", invalidData as any)
        ).rejects.toThrow();
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe("update()", () => {
      it("should full update an entity with PUT", async () => {
        const updateData = {
          title: "Updated Title",
          slug: "updated-slug",
          contentType: "POST" as const,
        };

        const mockResponse = {
          id: "node_123",
          ...updateData,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const result = await client.update("Content", "node_123", updateData);

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123",
          expect.objectContaining({
            method: "PUT",
            body: JSON.stringify(updateData),
          })
        );
        expect(result.title).toBe("Updated Title");
      });
    });

    describe("patch()", () => {
      it("should partial update an entity with PATCH", async () => {
        const patchData = { title: "Patched Title" };

        const mockResponse = {
          id: "node_123",
          title: "Patched Title",
          slug: "original-slug",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const result = await client.patch("Content", "node_123", patchData);

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123",
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify(patchData),
          })
        );
        expect(result.title).toBe("Patched Title");
      });
    });

    describe("delete()", () => {
      it("should delete an entity", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await client.delete("Content", "node_123");

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123",
          expect.objectContaining({
            method: "DELETE",
            headers: {
              Authorization: "Bearer test-api-key",
            },
            body: undefined,
          })
        );
      });

      it("should also handle 200 response with body", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ message: "Deleted", id: "node_123" }),
        });

        // Should not throw
        await expect(client.delete("Content", "node_123")).resolves.toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // Query DSL Operations
  // ===========================================================================

  describe("Query DSL Operations", () => {
    it("should execute query with where clause", async () => {
      const mockResponse = [
        {
          id: "node_123",
          title: "Published Post",
          slug: "published-post",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const queryOptions = {
        where: { contentType: { $eq: "POST" } },
        limit: 10,
      };

      const result = await client.query("Content", queryOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/query",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(queryOptions),
        })
      );
      expect(result).toHaveLength(1);
    });

    it("should execute query with traversal", async () => {
      const mockResponse = [
        {
          id: "node_123",
          title: "Post with Media",
          slug: "post-with-media",
          contentType: "POST",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const queryOptions = {
        where: { slug: { $eq: "my-post" } },
        traverse: [
          {
            relationship: "HAS_MEDIA" as const,
            direction: "out" as const,
            where: { role: { $eq: "FEATURED" } },
          },
        ],
      };

      await client.query("Content", queryOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.flxbl.dev/api/v1/dynamic/Content/query",
        expect.objectContaining({
          body: JSON.stringify(queryOptions),
        })
      );
    });

    it("should support traverse projection with include", async () => {
      const queryOptions = {
        traverse: [
          {
            relationship: "AUTHORED_BY" as const,
            direction: "out" as const,
            include: true,
            limit: 5,
            orderBy: "createdAt",
            orderDirection: "DESC" as const,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", queryOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(queryOptions),
        })
      );
    });

    it("should execute query with combined filters using $and", async () => {
      const queryOptions = {
        where: {
          $and: [
            { contentType: { $eq: "POST" } },
            { tags: { $contains: "featured" } },
          ],
        },
        orderBy: "createdAt",
        orderDirection: "DESC" as const,
        limit: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      });

      await client.query("Content", queryOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(queryOptions),
        })
      );
    });
  });

  // ===========================================================================
  // Relationship Operations
  // ===========================================================================

  describe("Relationship Operations", () => {
    describe("createRelationship()", () => {
      it("should create a relationship with properties", async () => {
        const mockResponse = {
          relationship: {
            type: "AUTHORED_BY",
            properties: {
              role: "PRIMARY",
              byline: "By John Doe",
            },
          },
          target: {
            id: "author_123",
            name: "John Doe",
            email: "john@example.com",
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockResponse,
        });

        const result = await client.createRelationship(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "author_123",
          { role: "PRIMARY", byline: "By John Doe" }
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              targetId: "author_123",
              properties: { role: "PRIMARY", byline: "By John Doe" },
            }),
          })
        );
        expect(result.relationship.properties.role).toBe("PRIMARY");
      });

      it("should validate relationship properties before sending", async () => {
        // AUTHORED_BY requires role
        const invalidProps = { byline: "Missing role" };

        await expect(
          client.createRelationship(
            "Content",
            "node_123",
            "AUTHORED_BY",
            "author_123",
            invalidProps as any
          )
        ).rejects.toThrow();
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    describe("getRelationships()", () => {
      it("should get relationships with direction parameter", async () => {
        const mockResponse = [
          {
            relationship: {
              type: "AUTHORED_BY",
              properties: { role: "PRIMARY" },
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
          json: async () => mockResponse,
        });

        const result = await client.getRelationships(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "out",
          "Author"
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY?direction=out",
          expect.any(Object)
        );
        expect(result).toHaveLength(1);
        expect(result[0].target.name).toBe("John Doe");
      });

      it("should parse relationship properties", async () => {
        const mockResponse = [
          {
            relationship: {
              type: "HAS_MEDIA",
              properties: { role: "FEATURED", position: 0, caption: "Hero image" },
            },
            target: {
              id: "media_123",
              filename: "hero.jpg",
              url: "https://cdn.example.com/hero.jpg",
              mimeType: "image/jpeg",
              size: 1024000,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        const result = await client.getRelationships(
          "Content",
          "node_123",
          "HAS_MEDIA",
          "out",
          "Media"
        );

        expect(result[0].relationship.properties.role).toBe("FEATURED");
        expect(result[0].relationship.properties.position).toBe(0);
      });
    });

    describe("updateRelationship()", () => {
      it("should update relationship properties with PATCH", async () => {
        const mockResponse = {
          relationship: {
            type: "AUTHORED_BY",
            properties: { role: "EDITOR", byline: "Updated byline" },
          },
          target: { id: "author_123" },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        await client.updateRelationship(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "author_123",
          { role: "EDITOR" }
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY/author_123",
          expect.objectContaining({
            method: "PATCH",
            body: JSON.stringify({ properties: { role: "EDITOR" } }),
          })
        );
      });
    });

    describe("deleteRelationship()", () => {
      it("should delete a relationship", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await client.deleteRelationship(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "author_123"
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.flxbl.dev/api/v1/dynamic/Content/node_123/relationships/AUTHORED_BY/author_123",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe("Error Handling", () => {
    it("should throw FlxblError with status code for 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Entity not found" }),
      });

      try {
        await client.get("Content", "nonexistent");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FlxblError);
        expect((error as FlxblError).statusCode).toBe(404);
        expect((error as FlxblError).message).toBe("Entity not found");
      }
    });

    it("should throw FlxblError with status code for 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid request body" }),
      });

      try {
        await client.create("Content", {
          title: "Test",
          slug: "test",
          contentType: "POST",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FlxblError);
        expect((error as FlxblError).statusCode).toBe(400);
      }
    });

    it("should throw FlxblError with status code for 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid or missing API key" }),
      });

      try {
        await client.list("Content");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FlxblError);
        expect((error as FlxblError).statusCode).toBe(401);
      }
    });

    it("should throw FlxblError with status code for 422 validation error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          statusCode: 422,
          message: "Invalid relationship properties for AUTHORED_BY",
          errors: [
            {
              field: "role",
              message: "Field 'role' is required",
              expectedType: "ENUM",
              actualValue: null,
            },
          ],
        }),
      });

      try {
        await client.createRelationship(
          "Content",
          "node_123",
          "AUTHORED_BY",
          "author_123",
          { role: "PRIMARY" }
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FlxblError);
        expect((error as FlxblError).statusCode).toBe(422);
        expect((error as FlxblError).details).toHaveProperty("errors");
      }
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.list("Content")).rejects.toThrow("Network error");
    });

    it("should handle malformed JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      try {
        await client.list("Content");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FlxblError);
        // When JSON parsing fails, falls back to "Request failed" message
        expect((error as FlxblError).message).toBe("Request failed");
        expect((error as FlxblError).statusCode).toBe(500);
      }
    });
  });

  // ===========================================================================
  // Request Header Verification
  // ===========================================================================

  describe("Request Headers", () => {
    it("should include Authorization header with Bearer token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { limit: 20, offset: 0, total: 0 } }),
      });

      await client.list("Content");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
          }),
        })
      );
    });

    it("should include Content-Type header for POST requests", async () => {
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
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should NOT include Content-Type header for GET requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { limit: 20, offset: 0, total: 0 } }),
      });

      await client.list("Content");

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).not.toHaveProperty("Content-Type");
    });

    it("should NOT include Content-Type header for DELETE requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.delete("Content", "node_123");

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).not.toHaveProperty("Content-Type");
    });
  });
});

