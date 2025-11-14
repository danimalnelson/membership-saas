import { NextResponse } from "next/server";

/**
 * Health check endpoint for monitoring
 * Tests that critical services are initialized
 */
export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      stripe: false,
      email: false,
      nextauth: false,
    },
    errors: [] as string[],
  };

  // Check Database
  try {
    const { prisma } = await import("@wine-club/db");
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = true;
  } catch (error) {
    health.checks.database = false;
    health.errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Stripe
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not set");
    }
    health.checks.stripe = true;
  } catch (error) {
    health.checks.stripe = false;
    health.errors.push(`Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check Email (Resend)
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not set");
    }
    if (!process.env.EMAIL_FROM) {
      throw new Error("EMAIL_FROM not set");
    }
    health.checks.email = true;
  } catch (error) {
    health.checks.email = false;
    health.errors.push(`Email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check NextAuth
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error("NEXTAUTH_SECRET not set");
    }
    if (!process.env.NEXTAUTH_URL && !process.env.VERCEL_URL) {
      throw new Error("Neither NEXTAUTH_URL nor VERCEL_URL set");
    }
    health.checks.nextauth = true;
  } catch (error) {
    health.checks.nextauth = false;
    health.errors.push(`NextAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Overall status
  const allHealthy = Object.values(health.checks).every(Boolean);
  health.status = allHealthy ? "healthy" : "degraded";

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}

