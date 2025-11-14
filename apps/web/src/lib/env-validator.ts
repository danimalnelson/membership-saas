/**
 * Environment variable validation
 * Run this at build time to catch missing vars early
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_CONNECT_CLIENT_ID",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

const optionalEnvVars = [
  "NEXTAUTH_URL", // Auto-detected in Vercel, but recommended
  "STRIPE_WEBHOOK_SECRET", // Only needed if using webhooks
  "VERCEL_URL", // Provided by Vercel automatically
] as const;

export function validateEnvironment() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional but recommended vars
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(`${varName} is not set (optional but recommended)`);
    }
  }

  // Validate format of critical vars
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgresql://")) {
    missing.push("DATABASE_URL must start with 'postgresql://'");
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
    missing.push("STRIPE_SECRET_KEY must start with 'sk_'");
  }

  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_")) {
    missing.push("RESEND_API_KEY must start with 're_'");
  }

  if (missing.length > 0) {
    console.error("\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:");
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error("\nSet these in .env.local (development) or Vercel Settings (production)\n");
    
    // Don't crash the build, just warn
    // In production, the /api/health endpoint will catch this
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  OPTIONAL ENVIRONMENT VARIABLES:");
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn("");
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

// Run validation at module load time in development
if (process.env.NODE_ENV === "development") {
  validateEnvironment();
}

