import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { requirePermission } from "@/lib/tenant-guard";

type Params = { params: Promise<{ businessId: string; memberId: string }> };

/**
 * PATCH /api/business/[businessId]/team/[memberId]
 * Change a team member's role.
 * Only OWNER can change roles. Cannot change the OWNER's own role.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { businessId, memberId } = await params;
    const { role } = await req.json();

    // Only OWNER can change roles
    await requirePermission(session.user.id, businessId, "team.changeRole");

    if (!["ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN or STAFF (Employee)." },
        { status: 400 }
      );
    }

    // Find the target member
    const target = await prisma.businessUser.findUnique({
      where: { id: memberId, businessId },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Cannot change the OWNER's role
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot change the business owner's role" },
        { status: 403 }
      );
    }

    await prisma.businessUser.update({
      where: { id: memberId },
      data: { role },
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    if (error.message?.startsWith("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[TEAM_ROLE_UPDATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/[businessId]/team/[memberId]
 * Remove a team member from the business.
 * OWNER and ADMIN can remove members. Cannot remove the OWNER.
 * Users cannot remove themselves.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { businessId, memberId } = await params;

    await requirePermission(session.user.id, businessId, "team.remove");

    // Find the target member
    const target = await prisma.businessUser.findUnique({
      where: { id: memberId, businessId },
      include: { user: { select: { id: true } } },
    });

    if (!target) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Cannot remove the OWNER
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the business owner" },
        { status: 403 }
      );
    }

    // Cannot remove yourself
    if (target.user.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the team" },
        { status: 400 }
      );
    }

    await prisma.businessUser.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.startsWith("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[TEAM_REMOVE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}
