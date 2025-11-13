/**
 * Redis-backed cache utility with in-memory fallback
 * 
 * Provides distributed caching using Upstash Redis.
 * Falls back to in-memory cache if Redis is not configured.
 */

import { Redis } from "@upstash/redis";

/**
 * Cache interface for type-safe caching
 */
export interface CacheInterface<T> {
  get(key: string, ttl: number): Promise<T | undefined>;
  set(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory cache implementation (fallback)
 */
class MemoryCache<T> implements CacheInterface<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();

  async get(key: string, ttl: number): Promise<T | undefined> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return undefined;
  }

  async set(key: string, data: T): Promise<void> {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Redis cache implementation
 */
class RedisCache<T> implements CacheInterface<T> {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(key: string, _ttl: number): Promise<T | undefined> {
    try {
      const data = await this.redis.get<T>(key);
      return data ?? undefined;
    } catch (error) {
      console.error("[Redis Cache] Get error:", error);
      return undefined;
    }
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        // TTL in seconds for Redis
        await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(data));
      } else {
        await this.redis.set(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error("[Redis Cache] Set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error("[Redis Cache] Delete error:", error);
    }
  }

  async clear(): Promise<void> {
    try {
      // Note: This is expensive - use with caution
      const keys = await this.redis.keys("*");
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error("[Redis Cache] Clear error:", error);
    }
  }
}

/**
 * Create Redis or in-memory cache
 * Automatically uses Redis if configured, falls back to in-memory
 */
export function createRedisCache<T>(): CacheInterface<T> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn(
      "[Cache] Redis not configured. Using in-memory cache. " +
      "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed caching."
    );
    return new MemoryCache<T>();
  }

  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return new RedisCache<T>(redis);
  } catch (error) {
    console.error("[Cache] Redis initialization failed, using in-memory:", error);
    return new MemoryCache<T>();
  }
}

/**
 * Cache key builder for consistent key naming
 * 
 * @example
 * const key = cacheKey("metrics", businessId, "daily");
 * // "cache:metrics:biz_123:daily"
 */
export function cacheKey(...parts: string[]): string {
  return `cache:${parts.join(":")}`;
}

/**
 * Cache wrapper with automatic serialization
 * Handles both Redis and in-memory caching transparently
 */
export class Cache<T> {
  private cache: CacheInterface<T>;

  constructor() {
    this.cache = createRedisCache<T>();
  }

  /**
   * Get cached value or compute it
   * 
   * @example
   * const metrics = await cache.getOrCompute(
   *   cacheKey("metrics", businessId),
   *   5 * 60 * 1000, // 5 minutes
   *   async () => calculateMetrics(businessId)
   * );
   */
  async getOrCompute(
    key: string,
    ttl: number,
    compute: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.cache.get(key, ttl);
    if (cached !== undefined) {
      return cached;
    }

    // Compute value
    const value = await compute();

    // Store in cache
    await this.cache.set(key, value, ttl);

    return value;
  }

  async get(key: string, ttl: number): Promise<T | undefined> {
    return this.cache.get(key, ttl);
  }

  async set(key: string, data: T, ttl?: number): Promise<void> {
    return this.cache.set(key, data, ttl);
  }

  async delete(key: string): Promise<void> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    return this.cache.clear();
  }
}

/**
 * Singleton cache instances by type
 * Reuse the same cache instance for each data type
 */
const cacheInstances = new Map<string, Cache<any>>();

/**
 * Get or create typed cache instance
 * 
 * @example
 * const metricsCache = getCache<BusinessMetrics>("metrics");
 * const metrics = await metricsCache.getOrCompute(
 *   cacheKey("metrics", id),
 *   CACHE_TTL.MEDIUM,
 *   () => calculateMetrics(id)
 * );
 */
export function getCache<T>(namespace: string): Cache<T> {
  if (!cacheInstances.has(namespace)) {
    cacheInstances.set(namespace, new Cache<T>());
  }
  return cacheInstances.get(namespace)!;
}

