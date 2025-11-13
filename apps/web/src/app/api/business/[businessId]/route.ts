import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma, Business } from "@wine-club/db";
import { CACHE_TTL, requireBusinessAuth, createCache } from "@wine-club/lib";

// Type-safe in-memory cache
const cache = createCache<Business>();

export async function GET(
  _req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await context.params;

  // Check auth and business access in one call
  const auth = await requireBusinessAuth(authOptions, prisma, businessId);
  if ("error" in auth) return auth.error;

  const { session, business } = auth;

  // Check cache
  const cacheKey = `business:${businessId}:${session.user.id}`;
  const cached = cache.get(cacheKey, CACHE_TTL.SHORT);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Update cache
  cache.set(cacheKey, business);

  return NextResponse.json(business);
}

