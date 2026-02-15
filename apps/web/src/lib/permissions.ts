/**
 * Role-based permission system
 *
 * Roles:
 *   OWNER    – Business creator. Full access. Cannot be removed.
 *   ADMIN    – Trusted managers. Can edit settings, manage team, take action on members/transactions.
 *   STAFF    – Employees. Read-only dashboard access + own notification preferences.
 *
 * This module is imported by both server (API routes) and client (UI gating),
 * so it must remain free of server-only imports.
 */

export type Role = "OWNER" | "ADMIN" | "STAFF";

// ─── Permission definitions ─────────────────────────────────────────────────

export const PERMISSIONS = {
  // Settings
  "settings.general": ["OWNER", "ADMIN"],
  "settings.branding": ["OWNER", "ADMIN"],
  "settings.notifications": ["OWNER", "ADMIN", "STAFF"], // own prefs only
  "settings.team": ["OWNER", "ADMIN"],

  // Members
  "members.view": ["OWNER", "ADMIN", "STAFF"],
  "members.edit": ["OWNER", "ADMIN"],
  "members.notes": ["OWNER", "ADMIN"],
  "members.cancel": ["OWNER", "ADMIN"],

  // Plans & Memberships
  "plans.view": ["OWNER", "ADMIN", "STAFF"],
  "plans.create": ["OWNER", "ADMIN"],
  "plans.edit": ["OWNER", "ADMIN"],
  "plans.delete": ["OWNER", "ADMIN"],

  // Transactions
  "transactions.view": ["OWNER", "ADMIN", "STAFF"],
  "transactions.refund": ["OWNER", "ADMIN"],

  // Dashboard
  "dashboard.view": ["OWNER", "ADMIN", "STAFF"],
  "dashboard.metrics": ["OWNER", "ADMIN", "STAFF"],

  // Team management
  "team.view": ["OWNER", "ADMIN"],
  "team.invite": ["OWNER", "ADMIN"],
  "team.remove": ["OWNER", "ADMIN"],
  "team.changeRole": ["OWNER"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  return (allowed as readonly string[]).includes(role);
}

/**
 * Check if a role is at least admin-level (OWNER or ADMIN).
 */
export function isAdmin(role: Role): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Check if a role is the business owner.
 */
export function isOwner(role: Role): boolean {
  return role === "OWNER";
}

/**
 * Human-readable label for a role (used in UI).
 */
export function getRoleLabel(role: Role): string {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "STAFF":
      return "Employee";
  }
}

/**
 * Roles that can be assigned by an admin (excludes OWNER).
 */
export const ASSIGNABLE_ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Employee" },
];
