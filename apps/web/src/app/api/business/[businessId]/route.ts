import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(
  _req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessId } = await context.params;

  // Check cache
  const cacheKey = `business:${businessId}:${session.user.id}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
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
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Update cache
  cache.set(cacheKey, {
    data: business,
    timestamp: Date.now(),
  });

  return NextResponse.json(business);
}

