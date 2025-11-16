import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { getStripeClient } from "@wine-club/lib";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { planIds, consumerEmail } = await request.json();

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "Plan IDs are required" },
        { status: 400 }
      );
    }

    if (!consumerEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find the business
    const business = await prisma.business.findUnique({
      where: { slug },
      include: { memberships: true },
    });

    if (!business?.stripeAccountId) {
      return NextResponse.json(
        { error: "Business not found or Stripe not connected" },
        { status: 404 }
      );
    }

    // Fetch all plans
    const plans = await prisma.plan.findMany({
      where: {
        id: { in: planIds },
        businessId: business.id,
        status: "ACTIVE",
      },
      include: {
        membership: true,
      },
    });

    if (plans.length !== planIds.length) {
      return NextResponse.json(
        { error: "One or more plans not found" },
        { status: 404 }
      );
    }

    // Check if membership allows multiple plans
    const membershipId = plans[0].membershipId;
    const membership = plans[0].membership;
    
    if (plans.length > 1 && !membership.allowMultiplePlans) {
      return NextResponse.json(
        { error: "This membership does not allow multiple plans" },
        { status: 400 }
      );
    }

    // All plans must be from same membership
    if (!plans.every((p) => p.membershipId === membershipId)) {
      return NextResponse.json(
        { error: "All plans must be from the same membership" },
        { status: 400 }
      );
    }

    // Check for existing consumer
    const existingConsumer = await prisma.consumer.findUnique({
      where: { email: consumerEmail },
    });

    const stripe = getStripeClient(business.stripeAccountId);
    let stripeCustomerId: string | undefined;

    if (existingConsumer) {
      // Find stripe customer via existing subscription
      const existingSub = await prisma.planSubscription.findFirst({
        where: {
          consumerId: existingConsumer.id,
          plan: { businessId: business.id },
        },
        select: { stripeCustomerId: true },
      });

      if (existingSub) {
        stripeCustomerId = existingSub.stripeCustomerId;
      }
    }

    // Build line items for all plans
    const lineItems = plans.map((plan) => {
      if (!plan.stripePriceId) {
        throw new Error(`Plan ${plan.name} has no Stripe price`);
      }

      return {
        price: plan.stripePriceId,
        quantity: 1,
      };
    });

    const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL || 
                        process.env.PUBLIC_APP_URL || 
                        `https://${process.env.VERCEL_URL}`;

    const successUrl = `${publicAppUrl}/${slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${publicAppUrl}/${slug}/plans`;

    // Create checkout session with multiple line items
    const sessionParams: any = {
      mode: "subscription",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      metadata: {
        businessId: business.id,
        membershipId: membershipId,
        planIds: planIds.join(','), // Store all plan IDs
        isMultiPlan: 'true',
      },
      subscription_data: {
        metadata: {
          businessId: business.id,
          membershipId: membershipId,
          planIds: planIds.join(','),
        },
      },
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = consumerEmail;
      sessionParams.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[MULTI_CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}


