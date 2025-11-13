import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { 
  createConnectedCheckoutSession, 
  ensureCustomerOnConnectedAccount,
  calculateNextCohortDate,
  ApiErrors,
  withMiddleware
} from "@wine-club/lib";
import { z } from "zod";

const createCheckoutSchema = z.object({
  consumerEmail: z.string().email().optional(),
  preferences: z.record(z.any()).optional(),
  giftFrom: z.string().optional(),
  giftMessage: z.string().optional(),
});

/**
 * Create Stripe Checkout Session for a Plan
 * 
 * POST /api/plans/[planId]/checkout
 * 
 * Creates a checkout session using the new Plan/Membership models.
 * Supports cohort billing, trial periods, and gift subscriptions.
 */
export const POST = withMiddleware(async (req: NextRequest, context): Promise<NextResponse> => {
  const { planId } = await (req as any).params as { planId: string };

  try {
    const body = await req.json();
    const { consumerEmail, preferences, giftFrom, giftMessage } = createCheckoutSchema.parse(body);

    // Find plan with membership and business
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        membership: true,
        business: true,
      },
    });

    if (!plan) {
      return ApiErrors.notFound("Plan not found") as NextResponse;
    }

    // Verify plan is active
    if (plan.status !== "ACTIVE") {
      return ApiErrors.badRequest(`Plan is not available (status: ${plan.status})`) as NextResponse;
    }

    // Verify membership is active
    if (plan.membership.status !== "ACTIVE") {
      return ApiErrors.badRequest("Membership is not available") as NextResponse;
    }

    // Verify business has Stripe connected
    if (!plan.business.stripeAccountId) {
      return ApiErrors.badRequest("Business has not completed Stripe onboarding") as NextResponse;
    }

    // Verify plan has Stripe price
    if (!plan.stripePriceId) {
      return ApiErrors.badRequest("Plan does not have a Stripe price configured") as NextResponse;
    }

    // Check inventory
    if (plan.stockStatus !== "AVAILABLE") {
      return ApiErrors.badRequest(`Plan is ${plan.stockStatus.toLowerCase()}`) as NextResponse;
    }

    // Check max subscribers
    if (plan.maxSubscribers) {
      const currentSubscribers = await prisma.planSubscription.count({
        where: {
          planId: plan.id,
          status: { in: ["active", "trialing"] },
        },
      });

      if (currentSubscribers >= plan.maxSubscribers) {
        return ApiErrors.badRequest("Plan is at capacity") as NextResponse;
      }
    }

    // Get or create customer if email provided
    let customerId: string | undefined;
    if (consumerEmail) {
      let consumer = await prisma.consumer.findUnique({
        where: { email: consumerEmail },
      });

      if (!consumer) {
        consumer = await prisma.consumer.create({
          data: { email: consumerEmail },
        });
      }

      customerId = await ensureCustomerOnConnectedAccount(
        consumer,
        plan.business.stripeAccountId
      );
    }

    const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

    // Prepare metadata
    const metadata: Record<string, string> = {
      businessId: plan.business.id,
      planId: plan.id,
      membershipId: plan.membership.id,
    };

    if (preferences) {
      metadata.preferences = JSON.stringify(preferences);
    }
    if (giftFrom) {
      metadata.giftFrom = giftFrom;
    }
    if (giftMessage) {
      metadata.giftMessage = giftMessage;
    }

    // Calculate billing cycle anchor for NEXT_INTERVAL memberships
    let billingCycleAnchor: number | undefined;
    if (
      plan.membership.billingAnchor === "NEXT_INTERVAL" &&
      plan.membership.cohortBillingDay
    ) {
      billingCycleAnchor = calculateNextCohortDate(
        plan.membership.cohortBillingDay
      );
    }

    // Create Stripe Checkout Session
    const session = await createConnectedCheckoutSession({
      accountId: plan.business.stripeAccountId,
      priceId: plan.stripePriceId,
      successUrl: `${publicAppUrl}/${plan.business.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${publicAppUrl}/${plan.business.slug}/plans/${plan.id}`,
      customerId,
      billingCycleAnchor,
      trialPeriodDays: plan.trialPeriodDays ?? undefined,
      applicationFeeAmount: plan.basePrice ? Math.floor(plan.basePrice * 0.1) : undefined, // 10% platform fee
      automaticTax: true,
      metadata,
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    if (error instanceof z.ZodError) {
      return ApiErrors.badRequest(JSON.stringify(error.errors)) as NextResponse;
    }
    return ApiErrors.internalError(
      error instanceof Error ? error.message : "Failed to create checkout session"
    ) as NextResponse;
  }
});

