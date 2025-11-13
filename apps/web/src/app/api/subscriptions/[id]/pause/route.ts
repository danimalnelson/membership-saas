import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { authOptions } from "@/lib/auth";
import { pauseSubscription } from "@wine-club/lib";
import { requireAuth, ApiErrors, withMiddleware } from "@wine-club/lib";

/**
 * Pause a subscription
 * 
 * POST /api/subscriptions/[id]/pause
 * 
 * Pauses billing for a subscription while keeping access.
 * Uses Stripe's pause_collection feature.
 */
export const POST = withMiddleware(async (req: NextRequest, context) => {
  const { id } = await (req as any).params as { id: string };

  // Authenticate user
  const authResult = await requireAuth(authOptions);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { session } = authResult;

  // Find subscription
  const subscription = await prisma.planSubscription.findUnique({
    where: { id },
    include: {
      plan: {
        include: {
          business: true,
        },
      },
      consumer: true,
    },
  });

  if (!subscription) {
    return ApiErrors.notFound("Subscription not found");
  }

  // Verify user owns this subscription
  if (subscription.consumer.userId !== session.user.id) {
    return ApiErrors.forbidden("You don't have access to this subscription");
  }

  // Check if plan allows pausing
  const membership = await prisma.membership.findUnique({
    where: { id: subscription.plan.membershipId },
  });

  if (!membership?.pauseEnabled) {
    return ApiErrors.badRequest("This membership does not allow pausing");
  }

  // Check if already paused
  if (subscription.status === "paused") {
    return ApiErrors.badRequest("Subscription is already paused");
  }

  // Check if subscription can be paused (must be active or trialing)
  if (!["active", "trialing"].includes(subscription.status)) {
    return ApiErrors.badRequest(
      `Cannot pause subscription with status: ${subscription.status}`
    );
  }

  if (!subscription.stripeSubscriptionId) {
    return ApiErrors.internalError("Missing Stripe subscription ID");
  }

  // Pause in Stripe
  try {
    const stripeSubscription = await pauseSubscription(
      subscription.plan.business.stripeAccountId!,
      subscription.stripeSubscriptionId
    );

    // Update database (webhook will also update, but we update now for immediate UX)
    await prisma.planSubscription.update({
      where: { id },
      data: {
        status: "paused",
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: "paused",
        pausedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to pause subscription:", error);
    return ApiErrors.internalError(
      error instanceof Error ? error.message : "Failed to pause subscription"
    );
  }
});

