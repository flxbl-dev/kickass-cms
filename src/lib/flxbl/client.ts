import {
  type EntityName,
  type RelationshipName,
  type EntityFromName,
  type CreateDtoFromName,
  type RelationshipPropsFromName,
  entitySchemas,
  relationshipPropSchemas,
} from "./types";

// =============================================================================
// Configuration
// =============================================================================

export interface FlxblConfig {
  baseUrl: string;
  apiKey: string;
}

// =============================================================================
// Query DSL Types
// =============================================================================

export interface QueryFilter {
  $eq?: unknown;
  $ne?: unknown;
  $gt?: number | string | Date;
  $gte?: number | string | Date;
  $lt?: number | string | Date;
  $lte?: number | string | Date;
  $in?: unknown[];
  $nin?: unknown[];
  $contains?: unknown;
}

export interface QueryWhere {
  [field: string]: QueryFilter | unknown;
  $and?: QueryWhere[];
  $or?: QueryWhere[];
}

export interface QueryTraversal {
  relationship: RelationshipName;
  direction: "in" | "out" | "both";
  where?: QueryWhere;
  traverse?: QueryTraversal[];
  /** When true, includes related entities in the response (traverse projection) */
  include?: boolean;
  /** Maximum number of related entities to return when include: true */
  limit?: number;
  /** Number of related entities to skip when include: true */
  offset?: number;
  /** Field to order included related entities by */
  orderBy?: string;
  /** Order direction for included related entities */
  orderDirection?: "ASC" | "DESC";
}

export interface QueryOptions {
  where?: QueryWhere;
  select?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
  traverse?: QueryTraversal[];
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

// =============================================================================
// Response Types
// =============================================================================

export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// =============================================================================
// Relationship Types
// =============================================================================

export interface RelationshipResult<
  TTarget = Record<string, unknown>,
  TProps = Record<string, unknown>,
> {
  relationship: {
    type: RelationshipName;
    properties: TProps;
  };
  target: TTarget;
}

// =============================================================================
// Error Handling
// =============================================================================

export class FlxblError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "FlxblError";
  }
}

// =============================================================================
// Client Factory
// =============================================================================

export function createFlxblClient(config: FlxblConfig) {
  const { baseUrl, apiKey } = config;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
    };

    // Only include Content-Type when there's a body
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${baseUrl}/api/v1/dynamic${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new FlxblError(
        error.message || `HTTP ${response.status}`,
        response.status,
        error,
      );
    }

    // Handle 204 No Content responses (DELETE)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  return {
    // =========================================================================
    // Entity CRUD Operations
    // =========================================================================

    /**
     * List all records of an entity type with optional pagination
     */
    async list<E extends EntityName>(
      entity: E,
      options?: ListOptions,
    ): Promise<EntityFromName<E>[]> {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());
      if (options?.orderBy) params.append("orderBy", options.orderBy);
      if (options?.orderDirection)
        params.append("orderDirection", options.orderDirection);

      const query = params.toString();
      const path = query ? `/${entity}?${query}` : `/${entity}`;

      // API may return { data: T[], pagination: {...} } wrapper or raw array
      const response = await request<ListResponse<unknown> | unknown[]>("GET", path);
      
      // Handle both wrapped and raw array responses
      const items = Array.isArray(response) ? response : response.data;
      return items.map((item) =>
        entitySchemas[entity].schema.parse(item),
      ) as EntityFromName<E>[];
    },

    /**
     * List all records with pagination metadata
     */
    async listWithPagination<E extends EntityName>(
      entity: E,
      options?: ListOptions,
    ): Promise<{ data: EntityFromName<E>[]; pagination: PaginationInfo }> {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());
      if (options?.orderBy) params.append("orderBy", options.orderBy);
      if (options?.orderDirection)
        params.append("orderDirection", options.orderDirection);

      const query = params.toString();
      const path = query ? `/${entity}?${query}` : `/${entity}`;

      const response = await request<ListResponse<unknown> | unknown[]>("GET", path);
      
      // Handle both wrapped and raw array responses
      if (Array.isArray(response)) {
        // Raw array - synthesize pagination info
        return {
          data: response.map((item) =>
            entitySchemas[entity].schema.parse(item),
          ) as EntityFromName<E>[],
          pagination: {
            limit: options?.limit ?? response.length,
            offset: options?.offset ?? 0,
            total: response.length,
          },
        };
      }
      
      return {
        data: response.data.map((item) =>
          entitySchemas[entity].schema.parse(item),
        ) as EntityFromName<E>[],
        pagination: response.pagination,
      };
    },

    /**
     * Get a single record by ID
     */
    async get<E extends EntityName>(
      entity: E,
      id: string,
    ): Promise<EntityFromName<E>> {
      const result = await request<unknown>("GET", `/${entity}/${id}`);
      return entitySchemas[entity].schema.parse(result) as EntityFromName<E>;
    },

    /**
     * Create a new record
     */
    async create<E extends EntityName>(
      entity: E,
      data: CreateDtoFromName<E>,
    ): Promise<EntityFromName<E>> {
      entitySchemas[entity].createSchema.parse(data);
      const result = await request<unknown>("POST", `/${entity}`, data);
      return entitySchemas[entity].schema.parse(result) as EntityFromName<E>;
    },

    /**
     * Full update of an existing record (PUT)
     */
    async update<E extends EntityName>(
      entity: E,
      id: string,
      data: Partial<CreateDtoFromName<E>>,
    ): Promise<EntityFromName<E>> {
      const result = await request<unknown>("PUT", `/${entity}/${id}`, data);
      return entitySchemas[entity].schema.parse(result) as EntityFromName<E>;
    },

    /**
     * Partial update of an existing record (PATCH)
     */
    async patch<E extends EntityName>(
      entity: E,
      id: string,
      data: Partial<CreateDtoFromName<E>>,
    ): Promise<EntityFromName<E>> {
      const result = await request<unknown>("PATCH", `/${entity}/${id}`, data);
      return entitySchemas[entity].schema.parse(result) as EntityFromName<E>;
    },

    /**
     * Delete a record by ID
     */
    async delete(entity: EntityName, id: string): Promise<void> {
      await request<void>("DELETE", `/${entity}/${id}`);
    },

    // =========================================================================
    // Query DSL Operations
    // =========================================================================

    /**
     * Execute a complex query using Query DSL
     * Supports filtering, pagination, ordering, and graph traversal
     *
     * @example
     * // Filter by status
     * await client.query('Content', {
     *   where: { status: { $eq: 'PUBLISHED' } },
     *   limit: 10
     * });
     *
     * @example
     * // Graph traversal with relationship property filtering
     * await client.query('Content', {
     *   where: { slug: { $eq: 'my-post' } },
     *   traverse: [{
     *     relationship: 'HAS_MEDIA',
     *     direction: 'out',
     *     where: { role: { $eq: 'FEATURED' } }
     *   }]
     * });
     */
    async query<E extends EntityName>(
      entity: E,
      options: QueryOptions,
    ): Promise<EntityFromName<E>[]> {
      const result = await request<unknown[]>(
        "POST",
        `/${entity}/query`,
        options,
      );
      return result.map((item) =>
        entitySchemas[entity].schema.parse(item),
      ) as EntityFromName<E>[];
    },

    // =========================================================================
    // Relationship Operations
    // =========================================================================

    /**
     * Create a relationship between two entities with typed properties
     */
    async createRelationship<R extends RelationshipName>(
      sourceEntity: EntityName,
      sourceId: string,
      relationship: R,
      targetId: string,
      properties: RelationshipPropsFromName<R>,
    ): Promise<RelationshipResult<unknown, RelationshipPropsFromName<R>>> {
      relationshipPropSchemas[relationship].parse(properties);
      return request(
        "POST",
        `/${sourceEntity}/${sourceId}/relationships/${relationship}`,
        { targetId, properties },
      );
    },

    /**
     * Get relationships for an entity with typed results
     */
    async getRelationships<R extends RelationshipName, TTarget extends EntityName>(
      entity: EntityName,
      id: string,
      relationship: R,
      direction: "in" | "out" | "both" = "out",
      targetEntity?: TTarget,
    ): Promise<RelationshipResult<EntityFromName<TTarget>, RelationshipPropsFromName<R>>[]> {
      const results = await request<RelationshipResult[]>(
        "GET",
        `/${entity}/${id}/relationships/${relationship}?direction=${direction}`,
      );
      
      // Parse and validate relationship properties
      return results.map((r) => ({
        relationship: {
          type: r.relationship.type,
          properties: relationshipPropSchemas[relationship].parse(
            r.relationship.properties,
          ) as RelationshipPropsFromName<R>,
        },
        target: targetEntity
          ? (entitySchemas[targetEntity].schema.parse(r.target) as EntityFromName<TTarget>)
          : (r.target as EntityFromName<TTarget>),
      }));
    },

    /**
     * Update relationship properties
     */
    async updateRelationship<R extends RelationshipName>(
      sourceEntity: EntityName,
      sourceId: string,
      relationship: R,
      targetId: string,
      properties: Partial<RelationshipPropsFromName<R>>,
    ): Promise<RelationshipResult<unknown, RelationshipPropsFromName<R>>> {
      return request(
        "PATCH",
        `/${sourceEntity}/${sourceId}/relationships/${relationship}/${targetId}`,
        { properties },
      );
    },

    /**
     * Delete a relationship
     */
    async deleteRelationship(
      sourceEntity: EntityName,
      sourceId: string,
      relationship: RelationshipName,
      targetId: string,
    ): Promise<void> {
      await request<void>(
        "DELETE",
        `/${sourceEntity}/${sourceId}/relationships/${relationship}/${targetId}`,
      );
    },
  };
}

// Type for the client instance
export type FlxblClient = ReturnType<typeof createFlxblClient>;

