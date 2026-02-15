import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@wine-club/db";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;

/**
 * Validate password requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

/**
 * POST /api/auth/set-password
 * Sets a password for a user who doesn't have one yet.
 * Requires an active session (user came via magic link).
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { password, confirmPassword } = await req.json();

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Password and confirmation are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const validationError = validatePassword(password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check if user already has a password
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { password: true },
    });

    if (user?.password) {
      return NextResponse.json(
        { error: "Password already set. Use change password instead." },
        { status: 400 }
      );
    }

    // Hash and save the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: token.sub },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[SET_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
