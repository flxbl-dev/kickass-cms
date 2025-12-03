import "server-only";

import { createFlxblClient, type FlxblConfig } from "./client";

/**
 * Get FLXBL configuration from environment variables
 * Throws if required variables are missing
 */
export function getFlxblConfig(): FlxblConfig {
  const baseUrl = process.env.FLXBL_BASE_URL;
  const apiKey = process.env.FLXBL_API_KEY;

  if (!baseUrl) {
    throw new Error("FLXBL_BASE_URL environment variable is not set");
  }

  if (!apiKey) {
    throw new Error("FLXBL_API_KEY environment variable is not set");
  }

  return { baseUrl, apiKey };
}

/**
 * Create a configured FLXBL client using environment variables
 * Use this in server components and API routes
 *
 * @example
 * import { getFlxblClient } from "@/lib/flxbl/config";
 *
 * export default async function Page() {
 *   const client = getFlxblClient();
 *   const content = await client.list("Content");
 *   return <div>{content.map(c => <p key={c.id}>{c.title}</p>)}</div>;
 * }
 */
export function getFlxblClient() {
  return createFlxblClient(getFlxblConfig());
}

