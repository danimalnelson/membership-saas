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
 * POST /api/auth/change-password
 * Changes the password for a user who already has one.
 * Requires the current password for verification.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "No password set. Use set password instead." },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: token.sub },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
