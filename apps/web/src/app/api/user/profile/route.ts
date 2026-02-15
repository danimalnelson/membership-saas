import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";

/**
 * PUT /api/user/profile
 * Update the current user's profile (name).
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (typeof name !== "string") {
      return NextResponse.json(
        { error: "Name must be a string" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() || null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[USER_PROFILE_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
