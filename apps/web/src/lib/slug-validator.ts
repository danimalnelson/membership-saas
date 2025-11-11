import { prisma } from "@wine-club/db";

/**
 * Validates business slug format
 * Rules: lowercase, alphanumeric, hyphens only, 3-50 chars
 */
export function isValidSlugFormat(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]{3,50}$/;
  return slugRegex.test(slug);
}

/**
 * Checks if slug is available (not taken by another business)
 */
export async function isSlugAvailable(slug: string, excludeBusinessId?: string): Promise<boolean> {
  const existing = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing) {
    return true;
  }

  // If excluding a business ID (for updates), check if it's the same business
  return excludeBusinessId ? existing.id === excludeBusinessId : false;
}

/**
 * Reserved slugs that cannot be used for businesses
 */
const RESERVED_SLUGS = [
  "app",
  "api",
  "auth",
  "admin",
  "dashboard",
  "login",
  "signin",
  "signup",
  "logout",
  "signout",
  "register",
  "settings",
  "profile",
  "account",
  "billing",
  "plans",
  "pricing",
  "docs",
  "help",
  "support",
  "about",
  "contact",
  "privacy",
  "terms",
  "legal",
  "embed",
  "widget",
  "static",
  "public",
  "assets",
  "images",
  "css",
  "js",
  "fonts",
  "_next",
  "favicon",
  "robots",
  "sitemap",
];

/**
 * Checks if slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Validates slug for business creation/update
 * Returns error message if invalid, null if valid
 */
export async function validateBusinessSlug(
  slug: string,
  excludeBusinessId?: string
): Promise<string | null> {
  // Check format
  if (!isValidSlugFormat(slug)) {
    return "Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only";
  }

  // Check reserved
  if (isReservedSlug(slug)) {
    return "This slug is reserved and cannot be used";
  }

  // Check availability
  const available = await isSlugAvailable(slug, excludeBusinessId);
  if (!available) {
    return "This slug is already taken";
  }

  return null;
}

