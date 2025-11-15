import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { getStripeClient } from "@wine-club/lib";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ subscriptionId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subscriptionId } = await context.params;
    const body = await req.json();
    const data = cancelSchema.parse(body);

    // Get subscription and verify access
    const planSubscription = await prisma.planSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: {
          include: {
            business: {
              include: {
                users: {
                  where: {
                    userId: session.user.id,
                    role: {
                      in: ["OWNER", "ADMIN"],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!planSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (planSubscription.plan.business.users.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const stripe = getStripeClient(planSubscription.plan.business.stripeAccountId!);

    // Cancel subscription at period end in Stripe
    const updated = await stripe.subscriptions.update(
      planSubscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
        ...(data.reason && {
          cancellation_details: {
            comment: data.reason,
          },
        }),
      }
    );

    // Update local status (webhook will also handle this)
    await prisma.planSubscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        lastSyncedAt: new Date(),
      },
    });

    // Add note about cancellation
    if (data.reason) {
      await prisma.memberNote.create({
        data: {
          consumerId: planSubscription.consumerId,
          content: `Subscription cancelled by ${session.user.name || session.user.email}\nReason: ${data.reason}`,
          createdById: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to cancel subscription", details: error.message },
      { status: 500 }
    );
  }
}

