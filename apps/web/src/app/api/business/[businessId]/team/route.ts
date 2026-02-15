import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { requirePermission } from "@/lib/tenant-guard";

/**
 * GET /api/business/[businessId]/team
 * List all team members for this business.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { businessId } = await params;

    await requirePermission(session.user.id, businessId, "team.view");

    const members = await prisma.businessUser.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first, then ADMIN, then STAFF
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        image: m.user.image,
        role: m.role,
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    if (error.message?.startsWith("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[TEAM_LIST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
