/**
 * @file queue.ts
 * @description QStash Client configuration for async job processing.
 * This client is used to publish messages to the QStash queue, which then calls our worker endpoints.
 */

import { Client } from '@upstash/qstash';
import { getBaseUrl } from '../urls/urls';

// Initialize QStash Client
// If tokens are missing (e.g. in development before setup), it will throw or fail gracefully depending on usage.
// For robust local dev without QStash, we might want to mock this or use a conditional check.
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN || 'mock_token',
  baseUrl: process.env.QSTASH_URL,
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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${normalizedPath}`;
};

export const canUseQStash = () => {
  const base = getBaseUrl();

  try {
    const url = new URL(base);
    const hostname = url.hostname.toLowerCase();
    const isLoopback =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost');

    const hasPublishToken = !!process.env.QSTASH_TOKEN && process.env.QSTASH_TOKEN !== 'mock_token';
    const hasSigningKeys = !!process.env.QSTASH_CURRENT_SIGNING_KEY && !!process.env.QSTASH_NEXT_SIGNING_KEY;

    // 没有签名密钥时 Worker 无法验证投递，不能把任务伪装成“已成功排队”。
    let localQueue = false;
    if (process.env.NODE_ENV === 'development' && process.env.QSTASH_URL) {
      const queueHost = new URL(process.env.QSTASH_URL).hostname;
      localQueue = ['localhost', '127.0.0.1', '[::1]'].includes(queueHost);
    }
    return (!isLoopback || localQueue) && hasPublishToken && hasSigningKeys;
  } catch {
    return false;
  }
};
