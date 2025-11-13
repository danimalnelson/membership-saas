import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import {
  calculateMetrics,
  CACHE_TTL,
  requireBusinessAuth,
  withMiddleware,
  getCache,
  cacheKey,
  type BusinessMetrics,
} from "@wine-club/lib";

// Redis-backed cache with in-memory fallback
const metricsCache = getCache<BusinessMetrics>("metrics");

export const GET = withMiddleware(async (req: NextRequest, context) => {
  const { businessId } = await (
    req as any
  ).params as { businessId: string };

  // Authenticate and authorize
  const authResult = await requireBusinessAuth(
    authOptions,
    prisma,
    businessId
  );

  if ("error" in authResult) {
    return authResult.error;
  }

  // Get or compute metrics with automatic caching
  const metrics = await metricsCache.getOrCompute(
    cacheKey("metrics", businessId),
    CACHE_TTL.MEDIUM,
    async () => {
      return calculateMetrics(prisma, businessId);
    }
  );

  return NextResponse.json(metrics);
});

