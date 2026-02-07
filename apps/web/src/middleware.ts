import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;
  const hostname = getHostname(request);
  const isDashboardHost = isDashboardHostname(hostname);
  const effectivePathname = getDashboardPathname(pathname, isDashboardHost);

  // Block debug/admin/test routes in production (unless explicitly enabled)
  if (isDebugRoute(effectivePathname) && !isAdminAccessAllowed()) {
    return NextResponse.json(
      { error: "Not available" },
      { status: 404 }
    );
  }

  // Protect /app routes (B2B dashboard)
  if (effectivePathname.startsWith("/app")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", effectivePathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check business access for /app/:businessId/* routes
    const businessIdMatch = effectivePathname.match(/^\/app\/([^\/]+)/);
    if (businessIdMatch && businessIdMatch[1] !== "switch") {
      const requestedBusinessId = businessIdMatch[1];
      
      // TODO: Verify user has access to this business
      // For now, we allow if user is authenticated
    }
  }

  if (isDashboardHost && effectivePathname !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePathname;
    return NextResponse.rewrite(url);
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

function getHostname(request: NextRequest): string {
  const host = request.headers.get("host") || "";
  return host.split(":")[0].toLowerCase();
}

function isDashboardHostname(hostname: string): boolean {
  return hostname === "dashboard.localhost" || hostname.startsWith("dashboard.");
}

function getDashboardPathname(pathname: string, isDashboardHost: boolean): string {
  if (!isDashboardHost || isDashboardPath(pathname)) {
    return pathname;
  }

  if (pathname === "/") {
    return "/app";
  }

  return `/app${pathname}`;
}

function isDashboardPath(pathname: string): boolean {
  return (
    pathname.startsWith("/app") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

