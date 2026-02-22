import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@wine-club/db";
import { authOptions } from "@/lib/auth";

const reorderPlansSchema = z.object({
  membershipId: z.string().min(1),
  planIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = reorderPlansSchema.parse(body);

    // Ensure the user can manage plans in this membership.
    const membership = await prisma.membership.findFirst({
      where: {
        id: data.membershipId,
        business: {
          users: {
            some: {
              userId: session.user.id,
              role: {
                in: ["OWNER", "ADMIN"],
              },
            },
          },
        },
      },
      select: {
        id: true,
        plans: {
          where: {
            status: {
              in: ["ACTIVE", "DRAFT"],
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found or access denied" },
        { status: 404 }
      );
    }

    const uniqueIncomingPlanIds = Array.from(new Set(data.planIds));
    if (uniqueIncomingPlanIds.length !== data.planIds.length) {
      return NextResponse.json(
        { error: "planIds must not contain duplicates" },
        { status: 400 }
      );
    }

    const existingPlanIds = membership.plans.map((p) => p.id).sort();
    const incomingPlanIds = [...data.planIds].sort();

    if (
      existingPlanIds.length !== incomingPlanIds.length ||
      existingPlanIds.some((id, index) => id !== incomingPlanIds[index])
    ) {
      return NextResponse.json(
        {
          error:
            "planIds must contain all and only reorderable plans for this club",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      data.planIds.map((planId, index) =>
        prisma.plan.update({
          where: { id: planId },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Reorder plans error:", error);
    return NextResponse.json(
      { error: "Failed to reorder plans" },
      { status: 500 }
    );
  }
}
