/**
 * Type-safe in-memory caching utilities
 * 
 * Provides simple caching with TTL support and proper TypeScript typing.
 * For production, consider upgrading to Redis for distributed caching.
 */

/**
 * Cache entry with data and timestamp
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Type-safe cache implementation
 * 
 * @example
 * const cache = new TypedCache<Business>();
 * cache.set('business:123', businessData, 120000); // 2 min TTL
 * const cached = cache.get('business:123', 120000);
 */
export class TypedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  /**
   * Set a value in the cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get a value from the cache if it exists and hasn't expired
   * 
   * @param key - Cache key
   * @param ttl - Time to live in milliseconds
   * @returns Cached data if valid, undefined otherwise
   */
  get(key: string, ttl: number): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string, ttl: number): boolean {
    return this.get(key, ttl) !== undefined;
  }

  /**
   * Manually invalidate a cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Create a typed cache instance
 * 
 * @example
 * const businessCache = createCache<Business>();
 * const metricsCache = createCache<BusinessMetrics>();
 */
export function createCache<T>(): TypedCache<T> {
  return new TypedCache<T>();
}

