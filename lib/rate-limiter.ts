/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Reset if window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + fullConfig.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= fullConfig.maxRequests;
  const remaining = Math.max(0, fullConfig.maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitHeaders(
  key: string,
  config?: Partial<RateLimitConfig>
): Record<string, string> {
  const limit = checkRateLimit(key, config);
  return {
    'X-RateLimit-Limit': String(config?.maxRequests || DEFAULT_CONFIG.maxRequests),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Reset': String(limit.resetTime),
  };
}

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
