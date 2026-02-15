import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@wine-club/db";
import { createHash, createHmac, timingSafeEqual } from "crypto";

const MAX_ATTEMPTS = 5;
const DEVICE_TRUST_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Create a signed device trust token.
 * Format: userId.issuedAt.signature
 */
function createDeviceTrustToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");

  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const payload = `${userId}.${issuedAt}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

/**
 * POST /api/auth/two-factor/verify
 * Validates a 6-digit code. On success, returns a signal for the
 * client to update the session, and sets a device trust cookie.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = token.sub;

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code" },
        { status: 400 }
      );
    }

    // Find the latest unused, unexpired code for this user
    const twoFactorCode = await prisma.twoFactorCode.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!twoFactorCode) {
      return NextResponse.json(
        { error: "No valid verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (twoFactorCode.attempts >= MAX_ATTEMPTS) {
      await prisma.twoFactorCode.update({
        where: { id: twoFactorCode.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Timing-safe comparison of hashed codes
    const inputHash = hashCode(code);
    const storedHash = twoFactorCode.code;

    const inputBuffer = Buffer.from(inputHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    const isValid =
      inputBuffer.length === storedBuffer.length &&
      timingSafeEqual(inputBuffer, storedBuffer);

    if (!isValid) {
      // Increment attempts
      await prisma.twoFactorCode.update({
        where: { id: twoFactorCode.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = MAX_ATTEMPTS - twoFactorCode.attempts - 1;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Invalid code. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Code is valid — mark as used
    await prisma.twoFactorCode.update({
      where: { id: twoFactorCode.id },
      data: { used: true },
    });

    // Create device trust cookie
    const deviceToken = createDeviceTrustToken(userId);
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Host-device-trust"
      : "device-trust";

    const response = NextResponse.json({ success: true });

    response.cookies.set(cookieName, deviceToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: DEVICE_TRUST_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[2FA_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
