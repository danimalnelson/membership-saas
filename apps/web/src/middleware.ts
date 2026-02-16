import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const DEVICE_TRUST_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

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

  // Allow NextAuth API routes through without any gates
  if (effectivePathname.startsWith("/api/auth/")) {
    if (isDashboardHost && effectivePathname !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = effectivePathname;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Protect /app routes (B2B dashboard)
  if (effectivePathname.startsWith("/app")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", effectivePathname);
      return NextResponse.redirect(signInUrl);
    }

    // Password gate: if user has no password set, redirect to set-password page
    if (!token.hasPassword) {
      const setPasswordUrl = new URL("/auth/set-password", request.url);
      setPasswordUrl.searchParams.set("callbackUrl", effectivePathname);
      return NextResponse.redirect(setPasswordUrl);
    }

    // 2FA gate: check if session has been verified
    if (!token.twoFactorVerified) {
      // Check for device trust cookie
      const isProduction = process.env.NODE_ENV === "production";
      const cookieName = isProduction ? "__Host-device-trust" : "device-trust";
      const deviceCookie = request.cookies.get(cookieName)?.value;

      const isTrusted = deviceCookie
        ? await verifyDeviceTrustToken(deviceCookie, token.sub!)
        : false;

      if (!isTrusted) {
        // Redirect to 2FA verification page
        const verifyUrl = new URL("/auth/verify-code", request.url);
        verifyUrl.searchParams.set("callbackUrl", effectivePathname);
        return NextResponse.redirect(verifyUrl);
      }

      // Device is trusted — allow through (client will update session)
    }
  }

  // Allow /auth/set-password for authenticated users without a password
  // Allow /auth/verify-code for authenticated but unverified users
  // (no additional checks needed — the pages themselves handle the flow)

  if (isDashboardHost && effectivePathname !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

/**
 * Verify a device trust token (Edge Runtime compatible).
 * Format: userId.issuedAt.signature
 */
async function verifyDeviceTrustToken(
  token: string,
  expectedUserId: string
): Promise<boolean> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [userId, issuedAtStr, signature] = parts;

    // Verify userId matches
    if (userId !== expectedUserId) return false;

    // Verify not expired
    const issuedAt = parseInt(issuedAtStr, 10);
    if (isNaN(issuedAt)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (now - issuedAt > DEVICE_TRUST_MAX_AGE) return false;

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const payload = `${userId}.${issuedAtStr}`;
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    if (signature.length !== expectedSignature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
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
