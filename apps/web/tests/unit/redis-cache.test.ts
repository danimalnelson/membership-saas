import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cacheKey,
  Cache,
  getCache,
} from "@wine-club/lib";

// Mock Upstash Redis to avoid requiring real Redis connection
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    setex: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
  })),
}));

describe("Redis Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("cacheKey", () => {
    it("should build cache key from parts", () => {
      const key = cacheKey("metrics", "biz_123", "daily");
      expect(key).toBe("cache:metrics:biz_123:daily");
    });

    it("should handle single part", () => {
      const key = cacheKey("users");
      expect(key).toBe("cache:users");
    });

    it("should handle many parts", () => {
      const key = cacheKey("a", "b", "c", "d", "e");
      expect(key).toBe("cache:a:b:c:d:e");
    });
  });

  describe("Cache class", () => {
    it("should create cache instance", () => {
      const cache = new Cache<{ value: number }>();
      expect(cache).toBeDefined();
      expect(cache).toHaveProperty("get");
      expect(cache).toHaveProperty("set");
      expect(cache).toHaveProperty("delete");
      expect(cache).toHaveProperty("clear");
    });

    it("should use in-memory cache when Redis not configured", async () => {
      // Redis env vars not set, should fall back to in-memory
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const cache = new Cache<{ count: number }>();
      
      await cache.set("test-key", { count: 42 });
      const result = await cache.get("test-key", 5000);
      
      expect(result).toEqual({ count: 42 });
    });

    it("should handle getOrCompute pattern", async () => {
      const cache = new Cache<string>();
      const compute = vi.fn().mockResolvedValue("computed-value");

      const result = await cache.getOrCompute(
        "test-key",
        5000,
        compute
      );

      expect(result).toBe("computed-value");
      expect(compute).toHaveBeenCalledOnce();
    });

    it("should not recompute if cached", async () => {
      const cache = new Cache<string>();
      const compute = vi.fn()
        .mockResolvedValueOnce("first")
        .mockResolvedValueOnce("second");

      // First call - should compute
      const result1 = await cache.getOrCompute(
        "test-key",
        5000,
        compute
      );

      // Second call - should use cache
      const result2 = await cache.getOrCompute(
        "test-key",
        5000,
        compute
      );

      expect(result1).toBe("first");
      expect(result2).toBe("first"); // Same value, not recomputed
      expect(compute).toHaveBeenCalledOnce();
    });

    it("should handle cache deletion", async () => {
      const cache = new Cache<number>();
      
      await cache.set("test-key", 123);
      await cache.delete("test-key");
      const result = await cache.get("test-key", 5000);
      
      expect(result).toBeUndefined();
    });

    it("should handle cache clear", async () => {
      const cache = new Cache<string>();
      
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.clear();
      
      const result1 = await cache.get("key1", 5000);
      const result2 = await cache.get("key2", 5000);
      
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });

  describe("getCache", () => {
    it("should return singleton cache instance", () => {
      const cache1 = getCache<number>("test-namespace");
      const cache2 = getCache<number>("test-namespace");
      
      expect(cache1).toBe(cache2);
    });

    it("should return different instances for different namespaces", () => {
      const cache1 = getCache<number>("namespace-1");
      const cache2 = getCache<number>("namespace-2");
      
      expect(cache1).not.toBe(cache2);
    });

    it("should maintain type safety", async () => {
      interface User {
        id: string;
        name: string;
      }

      const userCache = getCache<User>("users");
      
      await userCache.set("user-1", { id: "1", name: "Alice" });
      const user = await userCache.get("user-1", 5000);
      
      expect(user).toEqual({ id: "1", name: "Alice" });
    });
  });

  describe("Integration patterns", () => {
    it("should work with complex data types", async () => {
      interface BusinessMetrics {
        totalRevenue: number;
        activeMembers: number;
        metrics: {
          mrr: number;
          churn: number;
        };
      }

      const cache = getCache<BusinessMetrics>("metrics");
      const data: BusinessMetrics = {
        totalRevenue: 10000,
        activeMembers: 50,
        metrics: {
          mrr: 500,
          churn: 0.05,
        },
      };

      await cache.set(cacheKey("metrics", "biz_123"), data);
      const result = await cache.get(cacheKey("metrics", "biz_123"), 5000);

      expect(result).toEqual(data);
    });

    it("should handle cache miss gracefully", async () => {
      const cache = getCache<string>("test");
      const result = await cache.get("nonexistent-key", 5000);
      
      expect(result).toBeUndefined();
    });

    it("should support TTL-based expiration", async () => {
      vi.useFakeTimers();

      const cache = getCache<number>("test");
      
      await cache.set("expiring-key", 123);
      
      // Within TTL
      const result1 = await cache.get("expiring-key", 1000);
      expect(result1).toBe(123);
      
      // Advance time past TTL
      vi.advanceTimersByTime(1001);
      
      const result2 = await cache.get("expiring-key", 1000);
      expect(result2).toBeUndefined();

      vi.useRealTimers();
    });
  });
});

