import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { authOptions } from "@/lib/auth";
import { resumeSubscription } from "@wine-club/lib";
import { requireAuth, ApiErrors, withMiddleware } from "@wine-club/lib";

/**
 * Resume a paused subscription
 * 
 * POST /api/subscriptions/[id]/resume
 * 
 * Resumes billing for a paused subscription.
 * Per product decisions: billing date resets to resume date.
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

  // Check if currently paused
  if (subscription.status !== "paused") {
    return ApiErrors.badRequest(
      `Cannot resume subscription with status: ${subscription.status}`
    );
  }

  if (!subscription.stripeSubscriptionId) {
    return ApiErrors.internalError("Missing Stripe subscription ID");
  }

  // Resume in Stripe
  try {
    const stripeSubscription = await resumeSubscription(
      subscription.plan.business.stripeAccountId!,
      subscription.stripeSubscriptionId
    );

    // Update database (webhook will also update, but we update now for immediate UX)
    // Note: Stripe will reset billing date to now (per product decisions)
    await prisma.planSubscription.update({
      where: { id },
      data: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: stripeSubscription.status,
        resumedAt: new Date().toISOString(),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to resume subscription:", error);
    return ApiErrors.internalError(
      error instanceof Error ? error.message : "Failed to resume subscription"
    );
  }
});

