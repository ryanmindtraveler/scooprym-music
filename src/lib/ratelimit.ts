import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// Note: In development without real credentials, this might fail unless mocked.
// We wrap it in a try-catch or conditional to avoid crashing dev server if envs are missing.

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock_token',
});

// Create a new ratelimiter, that allows 6 requests per 60 seconds
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(6, '60 s'),
  analytics: true,
  prefix: '@scooprym/ratelimit',
});

export const mockRatelimit = {
  limit: async (identifier: string) => ({ success: true, limit: 10, remaining: 9, reset: 0 }),
};

// Helper: Safely get the limiter
export const getRateLimiter = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL.includes('mock-url')) {
    return mockRatelimit;
  }

  // Wrap limit in a try-catch for "Fail-Open" behavior
  return {
    limit: async (identifier: string) => {
      try {
        return await ratelimit.limit(identifier);
      } catch (error) {
        console.error('[RateLimit] Upstash Redis Error (Possibly Quota Hit):', error);
        // Fail-Open: allow request if limiter is broken
        return { success: true, limit: 10, remaining: 9, reset: 0 };
      }
    },
  };
};
