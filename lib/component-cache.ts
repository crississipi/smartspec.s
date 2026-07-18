/**
 * Component caching strategy for improved performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Set a cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = 60 * 60 * 1000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton cache instance
let cacheInstance: Cache | null = null;

export function getCache(): Cache {
  if (!cacheInstance) {
    cacheInstance = new Cache();
  }
  return cacheInstance;
}

/**
 * Wrapper for fetching with cache
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cache = getCache();

  // Check cache first
  const cached = cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  cache.set(key, data, ttl);

  return data;
}

/**
 * Clear component cache (useful for price updates)
 */
export function clearComponentCache(): void {
  const cache = getCache();
  const keysToDelete: string[] = [];

  // This is a bit hacky but works for clearing specific cache entries
  // In a real app, you'd track cache keys properly
  cache.clear();
}

/**
 * Get component price cache key
 */
export function getComponentCacheKey(type: string, brand?: string): string {
  return `component:${type}:${brand || 'all'}`;
}

/**
 * Get build recommendations cache key
 */
export function getBuildCacheKey(budget: number, useCase: string): string {
  return `build:${budget}:${useCase}`;
}
