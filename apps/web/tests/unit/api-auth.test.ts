/**
 * Unit tests for api-auth utilities
 * 
 * Tests authentication and authorization helpers to ensure
 * consistent behavior across all protected API routes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireBusinessAccess, requireBusinessAuth } from "@wine-club/lib";
import type { AuthOptions } from "next-auth";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";

describe("api-auth utilities", () => {
  const mockAuthOptions = {} as AuthOptions;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("should return session for authenticated user", async () => {
      const mockSession = {
        user: {
          id: "user_123",
          email: "test@example.com",
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

      const result = await requireAuth(mockAuthOptions);

      expect("session" in result).toBe(true);
      if ("session" in result) {
        expect(result.session.user.id).toBe("user_123");
        expect(result.session.user.email).toBe("test@example.com");
      }
    });

    it("should return error response for unauthenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await requireAuth(mockAuthOptions);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(401);
      }
    });

    it("should return error when user has no ID", async () => {
      const invalidSession = {
        user: {
          email: "test@example.com",
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(invalidSession as any);

      const result = await requireAuth(mockAuthOptions);

      expect("error" in result).toBe(true);
    });

    it("should return error when user object is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue({} as any);

      const result = await requireAuth(mockAuthOptions);

      expect("error" in result).toBe(true);
    });
  });

  describe("requireBusinessAccess", () => {
    let mockPrisma: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockPrisma = {
        business: {
          findFirst: vi.fn(),
        },
        businessUser: {
          findFirst: vi.fn(),
        },
      };
    });

    it("should return business for user with access", async () => {
      const mockBusiness = {
        id: "biz_123",
        name: "Test Business",
        slug: "test-business",
      };

      mockPrisma.business.findFirst.mockResolvedValue(mockBusiness);
      mockPrisma.businessUser.findFirst.mockResolvedValue({
        businessId: "biz_123",
      });

      const result = await requireBusinessAccess(
        mockPrisma,
        "user_123",
        "biz_123"
      );

      expect("business" in result).toBe(true);
      if ("business" in result) {
        expect(result.business.id).toBe("biz_123");
        expect(result.business.name).toBe("Test Business");
      }
    });

    it("should return 404 error when business not found", async () => {
      mockPrisma.business.findFirst.mockResolvedValue(null);
      mockPrisma.businessUser.findFirst.mockResolvedValue(null);

      const result = await requireBusinessAccess(
        mockPrisma,
        "user_123",
        "biz_123"
      );

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(404);
      }
    });

  });

  describe("requireBusinessAuth", () => {
    let mockPrisma: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockPrisma = {
        business: {
          findFirst: vi.fn(),
        },
        businessUser: {
          findFirst: vi.fn(),
        },
      };
    });

    it("should return session and business for authenticated user with access", async () => {
      const mockSession = {
        user: {
          id: "user_123",
          email: "test@example.com",
        },
      };

      const mockBusiness = {
        id: "biz_123",
        name: "Test Business",
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      mockPrisma.business.findFirst.mockResolvedValue(mockBusiness);
      mockPrisma.businessUser.findFirst.mockResolvedValue({
        businessId: "biz_123",
      });

      const result = await requireBusinessAuth(
        mockAuthOptions,
        mockPrisma,
        "biz_123"
      );

      expect("session" in result).toBe(true);
      expect("business" in result).toBe(true);
      if ("session" in result && "business" in result) {
        expect(result.session.user.id).toBe("user_123");
        expect(result.business.id).toBe("biz_123");
      }
    });

    it("should return error when user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await requireBusinessAuth(
        mockAuthOptions,
        mockPrisma,
        "biz_123"
      );

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(401);
      }
    });

    it("should return error when user lacks business access", async () => {
      const mockSession = {
        user: {
          id: "user_123",
          email: "test@example.com",
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      mockPrisma.business.findFirst.mockResolvedValue(null);
      mockPrisma.businessUser.findFirst.mockResolvedValue(null);

      const result = await requireBusinessAuth(
        mockAuthOptions,
        mockPrisma,
        "biz_123"
      );

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error.status).toBe(404);
      }
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await requireBusinessAuth(
        mockAuthOptions,
        mockPrisma,
        "biz_123"
      );

      expect("error" in result).toBe(true);
    });
  });

  describe("Type safety", () => {
    it("requireAuth return type should be discriminated union", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "123", email: "test@test.com" },
      } as any);

      const result = await requireAuth(mockAuthOptions);

      // TypeScript should narrow the type correctly
      if ("error" in result) {
        // @ts-expect-error - session should not exist in error branch
        expect(result.session).toBeUndefined();
      } else {
        // @ts-expect-error - error should not exist in success branch
        expect(result.error).toBeUndefined();
        expect(result.session).toBeDefined();
      }
    });

    it("requireBusinessAuth return type should be discriminated union", async () => {
      const mockSession = {
        user: { id: "user_123", email: "test@example.com" },
      };
      const mockBusiness = { id: "biz_123", name: "Test" };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      const mockPrisma = {
        business: {
          findFirst: vi.fn().mockResolvedValue(mockBusiness),
        },
        businessUser: {
          findFirst: vi.fn().mockResolvedValue({ businessId: "biz_123" }),
        },
      };

      const result = await requireBusinessAuth(
        mockAuthOptions,
        mockPrisma,
        "biz_123"
      );

      if ("error" in result) {
        // @ts-expect-error - session/business should not exist in error branch
        expect(result.session).toBeUndefined();
        // @ts-expect-error
        expect(result.business).toBeUndefined();
      } else {
        // @ts-expect-error - error should not exist in success branch
        expect(result.error).toBeUndefined();
        expect(result.session).toBeDefined();
        expect(result.business).toBeDefined();
      }
    });
  });
});

