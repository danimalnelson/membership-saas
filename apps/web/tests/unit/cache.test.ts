/**
 * Unit tests for TypedCache utility
 * 
 * Tests type-safe caching functionality to ensure consistent
 * and reliable caching behavior across the application.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCache, CACHE_TTL } from "@wine-club/lib";

interface TestData {
  id: string;
  name: string;
  count: number;
}

describe("TypedCache", () => {
  beforeEach(() => {
    // Clear all caches before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic operations", () => {
    it("should store and retrieve data", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      const retrieved = cache.get("key1", 1000);

      expect(retrieved).toEqual(data);
    });

    it("should return undefined for non-existent key", () => {
      const cache = createCache<TestData>();

      const result = cache.get("nonexistent", 1000);

      expect(result).toBeUndefined();
    });

    it("should overwrite existing data", () => {
      const cache = createCache<TestData>();
      const data1: TestData = { id: "123", name: "First", count: 1 };
      const data2: TestData = { id: "123", name: "Second", count: 2 };

      cache.set("key1", data1);
      cache.set("key1", data2);

      const result = cache.get("key1", 1000);
      expect(result).toEqual(data2);
    });

    it("should handle multiple keys independently", () => {
      const cache = createCache<TestData>();
      const data1: TestData = { id: "1", name: "First", count: 1 };
      const data2: TestData = { id: "2", name: "Second", count: 2 };

      cache.set("key1", data1);
      cache.set("key2", data2);

      expect(cache.get("key1", 1000)).toEqual(data1);
      expect(cache.get("key2", 1000)).toEqual(data2);
    });
  });

  describe("TTL (Time To Live)", () => {
    it("should return data within TTL", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      
      // Advance time but stay within TTL
      vi.advanceTimersByTime(500);
      
      const result = cache.get("key1", 1000);
      expect(result).toEqual(data);
    });

    it("should return undefined after TTL expires", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1001);
      
      const result = cache.get("key1", 1000);
      expect(result).toBeUndefined();
    });

    it("should respect different TTLs for same key", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      
      // Should be valid with long TTL
      vi.advanceTimersByTime(500);
      expect(cache.get("key1", 1000)).toEqual(data);
      
      // Should be expired with short TTL
      expect(cache.get("key1", 100)).toBeUndefined();
    });

    it("should work with CACHE_TTL constants", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      
      // Should work with predefined TTL constants
      expect(cache.get("key1", CACHE_TTL.SHORT)).toEqual(data);
      expect(cache.get("key1", CACHE_TTL.MEDIUM)).toEqual(data);
      expect(cache.get("key1", CACHE_TTL.LONG)).toEqual(data);
    });
  });

  describe("has method", () => {
    it("should return true for existing valid data", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);

      expect(cache.has("key1", 1000)).toBe(true);
    });

    it("should return false for non-existent key", () => {
      const cache = createCache<TestData>();

      expect(cache.has("nonexistent", 1000)).toBe(false);
    });

    it("should return false after TTL expires", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      
      vi.advanceTimersByTime(1001);

      expect(cache.has("key1", 1000)).toBe(false);
    });
  });

  describe("invalidate method", () => {
    it("should remove specific key", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);
      cache.invalidate("key1");

      expect(cache.get("key1", 1000)).toBeUndefined();
    });

    it("should not affect other keys", () => {
      const cache = createCache<TestData>();
      const data1: TestData = { id: "1", name: "First", count: 1 };
      const data2: TestData = { id: "2", name: "Second", count: 2 };

      cache.set("key1", data1);
      cache.set("key2", data2);
      
      cache.invalidate("key1");

      expect(cache.get("key1", 1000)).toBeUndefined();
      expect(cache.get("key2", 1000)).toEqual(data2);
    });

    it("should handle invalidating non-existent key", () => {
      const cache = createCache<TestData>();

      expect(() => cache.invalidate("nonexistent")).not.toThrow();
    });
  });

  describe("clear method", () => {
    it("should remove all cached data", () => {
      const cache = createCache<TestData>();
      const data1: TestData = { id: "1", name: "First", count: 1 };
      const data2: TestData = { id: "2", name: "Second", count: 2 };

      cache.set("key1", data1);
      cache.set("key2", data2);
      
      cache.clear();

      expect(cache.get("key1", 1000)).toBeUndefined();
      expect(cache.get("key2", 1000)).toBeUndefined();
    });

    it("should allow setting new data after clear", () => {
      const cache = createCache<TestData>();
      const data1: TestData = { id: "1", name: "First", count: 1 };
      const data2: TestData = { id: "2", name: "Second", count: 2 };

      cache.set("key1", data1);
      cache.clear();
      cache.set("key1", data2);

      expect(cache.get("key1", 1000)).toEqual(data2);
    });
  });

  describe("Type safety", () => {
    it("should enforce type constraints", () => {
      interface User {
        id: string;
        email: string;
      }

      const cache = createCache<User>();
      const user: User = { id: "123", email: "test@example.com" };

      cache.set("user1", user);
      const retrieved = cache.get("user1", 1000);

      // TypeScript should know retrieved is User | undefined
      if (retrieved) {
        expect(retrieved.id).toBe("123");
        expect(retrieved.email).toBe("test@example.com");
      }
    });

    it("should work with complex nested types", () => {
      interface ComplexData {
        user: {
          id: string;
          profile: {
            name: string;
            settings: Record<string, any>;
          };
        };
        metadata: {
          created: Date;
          tags: string[];
        };
      }

      const cache = createCache<ComplexData>();
      const data: ComplexData = {
        user: {
          id: "123",
          profile: {
            name: "Test",
            settings: { theme: "dark" },
          },
        },
        metadata: {
          created: new Date(),
          tags: ["tag1", "tag2"],
        },
      };

      cache.set("complex", data);
      const retrieved = cache.get("complex", 1000);

      expect(retrieved).toEqual(data);
    });
  });

  describe("Performance and edge cases", () => {
    it("should handle large datasets", () => {
      const cache = createCache<TestData>();

      // Store 1000 items
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, { id: `${i}`, name: `Item ${i}`, count: i });
      }

      // Retrieve random items
      expect(cache.get("key500", 1000)).toEqual({
        id: "500",
        name: "Item 500",
        count: 500,
      });
    });

    it("should handle rapid set/get operations", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      // Rapid operations
      for (let i = 0; i < 100; i++) {
        cache.set("key1", data);
        expect(cache.get("key1", 1000)).toEqual(data);
      }
    });

    it("should handle null and undefined data correctly", () => {
      const cache = createCache<TestData | null>();

      cache.set("null-key", null);
      
      const result = cache.get("null-key", 1000);
      expect(result).toBeNull();
    });

    it("should handle concurrent operations", () => {
      const cache = createCache<TestData>();

      // Simulate concurrent writes to different keys
      const data1: TestData = { id: "1", name: "First", count: 1 };
      const data2: TestData = { id: "2", name: "Second", count: 2 };
      const data3: TestData = { id: "3", name: "Third", count: 3 };

      cache.set("key1", data1);
      cache.set("key2", data2);
      cache.set("key3", data3);

      expect(cache.get("key1", 1000)).toEqual(data1);
      expect(cache.get("key2", 1000)).toEqual(data2);
      expect(cache.get("key3", 1000)).toEqual(data3);
    });
  });

  describe("CACHE_TTL constants", () => {
    it("should have correct TTL values", () => {
      expect(CACHE_TTL.SHORT).toBe(2 * 60 * 1000); // 2 minutes
      expect(CACHE_TTL.MEDIUM).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_TTL.LONG).toBe(15 * 60 * 1000); // 15 minutes
    });

    it("should work with all TTL constants", () => {
      const cache = createCache<TestData>();
      const data: TestData = { id: "123", name: "Test", count: 42 };

      cache.set("key1", data);

      // All should be valid immediately
      expect(cache.get("key1", CACHE_TTL.SHORT)).toEqual(data);
      expect(cache.get("key1", CACHE_TTL.MEDIUM)).toEqual(data);
      expect(cache.get("key1", CACHE_TTL.LONG)).toEqual(data);
    });
  });
});

