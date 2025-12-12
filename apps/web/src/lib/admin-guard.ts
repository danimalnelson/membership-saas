/**
 * Admin/Debug Route Protection
 * 
 * Protects admin and debug routes from being accessed in production
 * unless explicitly enabled via environment variable.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Check if admin/debug routes should be accessible
 * 
 * Returns true if:
 * - Running in development (NODE_ENV !== 'production')
 * - Or ENABLE_ADMIN_ROUTES=true is set
 */
export function isAdminAccessAllowed(): boolean {
  // Always allow in development
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // In production, require explicit opt-in
  return process.env.ENABLE_ADMIN_ROUTES === "true";
}

/**
 * Middleware helper to protect admin routes
 * Use in API routes: if (!isAdminAccessAllowed()) return adminRouteBlocked();
 */
export function adminRouteBlocked(): NextResponse {
  return NextResponse.json(
    { 
      error: "Not available", 
      message: "This endpoint is disabled in production" 
    },
    { status: 404 }
  );
}

/**
 * Check if current request is to a debug/admin route
 */
export function isDebugRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/debug/") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/test/") ||
    pathname.startsWith("/admin/")
  );
}
