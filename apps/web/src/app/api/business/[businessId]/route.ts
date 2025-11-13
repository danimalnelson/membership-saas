import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { ApiErrors, CACHE_TTL } from "@wine-club/lib";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

export async function GET(
  _req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return ApiErrors.unauthorized();
  }

  const { businessId } = await context.params;

  // Check cache
  const cacheKey = `business:${businessId}:${session.user.id}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL.SHORT) {
    return NextResponse.json(cached.data);
  }

  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!business) {
    return ApiErrors.notFound("Business", { businessId });
  }

  // Update cache
  cache.set(cacheKey, {
    data: business,
    timestamp: Date.now(),
  });

  return NextResponse.json(business);
}

