import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Block debug/admin/test routes in production (unless explicitly enabled)
  if (isDebugRoute(pathname) && !isAdminAccessAllowed()) {
    return NextResponse.json(
      { error: "Not available" },
      { status: 404 }
    );
  }

  // Protect /app routes (B2B dashboard)
  if (pathname.startsWith("/app")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check business access for /app/:businessId/* routes
    const businessIdMatch = pathname.match(/^\/app\/([^\/]+)/);
    if (businessIdMatch && businessIdMatch[1] !== "switch") {
      const requestedBusinessId = businessIdMatch[1];
      
      // TODO: Verify user has access to this business
      // For now, we allow if user is authenticated
    }
  }

  return NextResponse.next();
}

/**
 * Check if admin/debug routes should be accessible
 */
function isAdminAccessAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return process.env.ENABLE_ADMIN_ROUTES === "true";
}

/**
 * Check if current request is to a debug/admin route
 */
function isDebugRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/debug/") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/test/") ||
    pathname.startsWith("/admin/")
  );
}

export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/api/debug/:path*",
    "/api/admin/:path*",
    "/api/test/:path*",
  ],
};

