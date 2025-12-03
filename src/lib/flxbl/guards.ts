import type { FlxblClient } from "./client";
import type { EntityName } from "./types";

// =============================================================================
// Demo Content Protection
// =============================================================================

/**
 * Error thrown when attempting to modify system/demo content
 */
export class SystemContentError extends Error {
  public readonly statusCode = 403;

  constructor(entityType: string) {
    super(`Demo ${entityType.toLowerCase()} cannot be modified. Please create new content to test editing.`);
    this.name = "SystemContentError";
  }
}

/**
 * Check if an entity has isSystem flag set to true
 * Returns the entity if mutable, throws SystemContentError if not
 */
export async function ensureMutable(
  client: FlxblClient,
  entityType: EntityName,
  entityId: string,
): Promise<void> {
  const entity = await client.get(entityType, entityId) as { isSystem?: boolean | null };

  if (entity.isSystem === true) {
    throw new SystemContentError(entityType);
  }
}

/**
 * Check if an entity is mutable (not a system entity)
 * Returns true if mutable, false if system content
 */
export async function isMutable(
  client: FlxblClient,
  entityType: EntityName,
  entityId: string,
): Promise<boolean> {
  try {
    const entity = await client.get(entityType, entityId) as { isSystem?: boolean | null };
    return entity.isSystem !== true;
  } catch {
    // Entity not found - consider it mutable (will fail on actual operation)
    return true;
  }
}

/**
 * Helper to create a 403 response for system content
 */
export function createSystemContentResponse(entityType: string) {
  return {
    message: `Demo ${entityType.toLowerCase()} cannot be modified. Please create new content to test editing.`,
    code: "SYSTEM_CONTENT_PROTECTED",
  };
}

