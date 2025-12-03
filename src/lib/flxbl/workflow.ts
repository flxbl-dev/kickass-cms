/**
 * Workflow State Management
 * 
 * Handles content lifecycle and state transitions
 */

import type { FlxblClient } from "./client";
import type { WorkflowState, Content, HasStateProps } from "./types";

// =============================================================================
// State Operations
// =============================================================================

/**
 * Get all workflow states in order
 */
export async function getAllStates(
  client: FlxblClient
): Promise<WorkflowState[]> {
  return client.list("WorkflowState", {
    orderBy: "position",
    orderDirection: "ASC",
  });
}

/**
 * Get a state by slug
 */
export async function getStateBySlug(
  client: FlxblClient,
  slug: string
): Promise<WorkflowState | null> {
  const states = await client.query("WorkflowState", {
    where: { slug: { $eq: slug } },
    limit: 1,
  });

  return states[0] ?? null;
}

/**
 * Get the current state for content
 */
export async function getContentState(
  client: FlxblClient,
  contentId: string
): Promise<{ state: WorkflowState; props: HasStateProps } | null> {
  const rels = await client.getRelationships(
    "Content",
    contentId,
    "HAS_STATE",
    "out",
    "WorkflowState"
  );

  if (rels.length === 0) return null;

  return {
    state: rels[0].target,
    props: rels[0].relationship.properties,
  };
}

/**
 * Get allowed transitions from current state
 */
export async function getAllowedTransitions(
  client: FlxblClient,
  currentStateSlug: string
): Promise<WorkflowState[]> {
  const currentState = await getStateBySlug(client, currentStateSlug);
  if (!currentState) return [];

  const allowedSlugs = currentState.allowedTransitions ?? [];
  if (allowedSlugs.length === 0) return [];

  const allStates = await getAllStates(client);
  return allStates.filter((s) => allowedSlugs.includes(s.slug));
}

/**
 * Check if a transition is allowed
 */
export async function canTransitionTo(
  client: FlxblClient,
  fromStateSlug: string,
  toStateSlug: string
): Promise<boolean> {
  const fromState = await getStateBySlug(client, fromStateSlug);
  if (!fromState) return false;

  return (fromState.allowedTransitions ?? []).includes(toStateSlug);
}

/**
 * Transition content to a new state
 */
export async function transitionState(
  client: FlxblClient,
  contentId: string,
  newStateId: string,
  assignedBy?: string
): Promise<void> {
  // Get current state
  const currentStateRel = await getContentState(client, contentId);

  // Delete existing state relationship
  if (currentStateRel) {
    await client.deleteRelationship(
      "Content",
      contentId,
      "HAS_STATE",
      currentStateRel.state.id
    );
  }

  // Create new state relationship
  await client.createRelationship(
    "Content",
    contentId,
    "HAS_STATE",
    newStateId,
    {
      assignedAt: new Date(),
      assignedBy: assignedBy ?? "system",
    }
  );

  // If transitioning to published, update publishedAt
  const newState = await client.get("WorkflowState", newStateId);
  if (newState.slug === "published") {
    await client.patch("Content", contentId, {
      publishedAt: new Date(),
    });
  }
}

/**
 * Get content by state
 */
export async function getContentByState(
  client: FlxblClient,
  stateSlug: string,
  options?: { limit?: number; offset?: number }
): Promise<Content[]> {
  const state = await getStateBySlug(client, stateSlug);
  if (!state) return [];

  // Get content IDs with this state
  const stateRels = await client.getRelationships(
    "WorkflowState",
    state.id,
    "HAS_STATE",
    "in",
    "Content"
  );

  return stateRels
    .map((r) => r.target)
    .slice(options?.offset ?? 0, (options?.offset ?? 0) + (options?.limit ?? 100));
}

/**
 * Count content by state
 */
export async function countContentByState(
  client: FlxblClient
): Promise<Map<string, number>> {
  const states = await getAllStates(client);
  const counts = new Map<string, number>();

  for (const state of states) {
    const rels = await client.getRelationships(
      "WorkflowState",
      state.id,
      "HAS_STATE",
      "in",
      "Content"
    );
    counts.set(state.slug, rels.length);
  }

  return counts;
}

// =============================================================================
// Workflow Validation
// =============================================================================

/**
 * Validate a state transition
 */
export interface TransitionValidation {
  valid: boolean;
  reason?: string;
}

export async function validateTransitionAsync(
  client: FlxblClient,
  contentId: string,
  newStateSlug: string
): Promise<TransitionValidation> {
  // Get current state
  const currentStateRel = await getContentState(client, contentId);
  if (!currentStateRel) {
    // No current state, any transition is valid
    return { valid: true };
  }

  // Check if transition is allowed
  const allowed = await canTransitionTo(
    client,
    currentStateRel.state.slug,
    newStateSlug
  );

  if (!allowed) {
    return {
      valid: false,
      reason: `Cannot transition from "${currentStateRel.state.name}" to "${newStateSlug}"`,
    };
  }

  return { valid: true };
}

/**
 * Pure function to validate a state transition (for testing/UI)
 */
export function validateTransition(
  fromStateSlug: string,
  toStateSlug: string,
  states: WorkflowState[]
): TransitionValidation {
  const fromState = states.find((s) => s.slug === fromStateSlug);
  if (!fromState) {
    return {
      valid: false,
      reason: `Source state "${fromStateSlug}" not found`,
    };
  }

  const toState = states.find((s) => s.slug === toStateSlug);
  if (!toState) {
    return {
      valid: false,
      reason: `Target state "${toStateSlug}" not found`,
    };
  }

  const allowedSlugs = fromState.allowedTransitions ?? [];
  if (!allowedSlugs.includes(toStateSlug)) {
    return {
      valid: false,
      reason: `Transition from "${fromState.name}" to "${toState.name}" is not allowed`,
    };
  }

  return { valid: true };
}

// =============================================================================
// Workflow State Transitions
// =============================================================================

export interface StateTransitionRule {
  fromState: string;
  toState: string;
  targetSlug: string;
  requiresApproval?: boolean;
  notifyRoles?: string[];
}

/**
 * Get state transition rules (async with client)
 */
export async function getTransitionRulesAsync(
  client: FlxblClient
): Promise<StateTransitionRule[]> {
  const states = await getAllStates(client);
  const rules: StateTransitionRule[] = [];

  for (const state of states) {
    // Get outgoing STATE_TRANSITION relationships
    const transitionRels = await client.getRelationships(
      "WorkflowState",
      state.id,
      "STATE_TRANSITION",
      "out",
      "WorkflowState"
    );

    for (const rel of transitionRels) {
      rules.push({
        fromState: state.slug,
        toState: rel.target.slug,
        targetSlug: rel.target.slug,
        requiresApproval: (rel.relationship.properties as { requiresApproval?: boolean }).requiresApproval ?? false,
        notifyRoles: (rel.relationship.properties as { notifyRoles?: string[] }).notifyRoles ?? [],
      });
    }
  }

  return rules;
}

/**
 * Pure function to get available transitions from a state (for testing/UI)
 */
export function getTransitionRules(
  fromStateSlug: string,
  states: WorkflowState[]
): StateTransitionRule[] {
  const fromState = states.find((s) => s.slug === fromStateSlug);
  if (!fromState) return [];

  const allowedSlugs = fromState.allowedTransitions ?? [];
  
  return allowedSlugs.map((targetSlug) => ({
    fromState: fromStateSlug,
    toState: targetSlug,
    targetSlug,
  }));
}

