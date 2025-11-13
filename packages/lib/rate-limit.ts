/**
 * Rate limiting utilities using Upstash
 * 
 * Provides serverless-friendly rate limiting for API routes.
 * Falls back gracefully if Redis is not configured.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrors } from "./api-errors";
import type { ApiHandler, RequestContext } from "./api-middleware";

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Number of requests allowed
   */
  requests: number;
  
  /**
   * Time window (e.g., "10 s", "1 m", "1 h", "1 d")
   */
  window: string;
  
  /**
   * Optional prefix for rate limit keys
   */
  prefix?: string;
}

/**
 * Create rate limiter instance
 * Returns null if Redis is not configured (graceful degradation)
 */
function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn(
      "[Rate Limit] Redis not configured. Rate limiting disabled. " +
      "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable."
    );
    return null;
  }

  try {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.requests,
        config.window as any
      ),
      prefix: config.prefix || "ratelimit",
      analytics: true,
    });
  } catch (error) {
    console.error("[Rate Limit] Failed to initialize:", error);
    return null;
  }
}

/**
 * Get rate limit identifier from request
 * Uses IP address if available, otherwise falls back to a default
 */
function getRateLimitIdentifier(req: NextRequest): string {
  // Try to get IP from various sources
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "anonymous";

  return ip.trim();
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for sensitive operations (login, signup)
   * 5 requests per 10 seconds
   */
  STRICT: {
    requests: 5,
    window: "10 s",
    prefix: "ratelimit:strict",
  } as RateLimitConfig,

  /**
   * Standard rate limit for API routes
   * 30 requests per minute
   */
  STANDARD: {
    requests: 30,
    window: "1 m",
    prefix: "ratelimit:standard",
  } as RateLimitConfig,

  /**
   * Generous rate limit for public endpoints
   * 100 requests per minute
   */
  GENEROUS: {
    requests: 100,
    window: "1 m",
    prefix: "ratelimit:generous",
  } as RateLimitConfig,

  /**
   * Per-user rate limit for authenticated requests
   * 1000 requests per hour
   */
  PER_USER: {
    requests: 1000,
    window: "1 h",
    prefix: "ratelimit:user",
  } as RateLimitConfig,
};

/**
 * Rate limit middleware
 * 
 * @example
 * // Standard rate limit (30 req/min)
 * export const GET = withRateLimit()(async (req, context) => {
 *   return NextResponse.json({ data });
 * });
 * 
 * @example
 * // Custom rate limit
 * export const POST = withRateLimit({
 *   requests: 5,
 *   window: "10 s"
 * })(async (req, context) => {
 *   return NextResponse.json({ success: true });
 * });
 */
export function withRateLimit(
  config: RateLimitConfig = RateLimitPresets.STANDARD
): (handler: ApiHandler) => ApiHandler {
  const limiter = createRateLimiter(config);

  return (handler: ApiHandler) => {
    return async (req: NextRequest, context: RequestContext) => {
      // If rate limiter not configured, skip rate limiting
      if (!limiter) {
        return handler(req, context);
      }

      try {
        const identifier = getRateLimitIdentifier(req);
        const { success, limit, remaining, reset } = await limiter.limit(
          identifier
        );

        // Add rate limit headers to all responses
        const response = success
          ? await handler(req, context)
          : ApiErrors.serviceUnavailable(
              "Too many requests. Please try again later."
            );

        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());

        if (!success) {
          response.headers.set("Retry-After", Math.ceil((reset - Date.now()) / 1000).toString());
        }

        return response;
      } catch (error) {
        // On rate limit check error, allow request through (fail open)
        console.error("[Rate Limit] Check failed:", error);
        return handler(req, context);
      }
    };
  };
}

/**
 * Check rate limit without middleware
 * Useful for custom logic
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RateLimitPresets.STANDARD
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const limiter = createRateLimiter(config);

  if (!limiter) {
    // Rate limiting disabled, allow through
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60000,
    };
  }

  return limiter.limit(identifier);
}

