/**
 * @file queue.ts
 * @description QStash Client configuration for async job processing.
 * This client is used to publish messages to the QStash queue, which then calls our worker endpoints.
 */

import { Client } from "@upstash/qstash";
import { getBaseUrl } from "./urls/urls";

// Initialize QStash Client
// If tokens are missing (e.g. in development before setup), it will throw or fail gracefully depending on usage.
// For robust local dev without QStash, we might want to mock this or use a conditional check.
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "mock_token",
});

/**
 * Helper to determine the destination URL for the worker.
 * In production, it must be the public Vercel/Cloudflare URL.
 * In development, QStash cannot reach localhost directly without a tunnel (like ngrok).
 *
 * Recommendation for Dev: Use a tool like ngrok to expose localhost and set NEXT_PUBLIC_BASE_URL to the ngrok URL.
 */
export const getWorkerUrl = (path: string) => {
  const base = getBaseUrl();
  // Ensure path has leading slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalizedPath}`;
};
