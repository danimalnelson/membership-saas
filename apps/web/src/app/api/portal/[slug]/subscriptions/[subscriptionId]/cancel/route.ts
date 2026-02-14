import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@wine-club/db";
import { getStripeClient } from "@wine-club/lib";
import { decodeConsumerSession } from "@/lib/consumer-auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string; subscriptionId: string }> }
) {
  try {
    const { slug, subscriptionId } = await context.params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("consumer_session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = decodeConsumerSession(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get business
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business || !business.stripeAccountId) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get subscription and verify ownership
    const planSubscription = await prisma.planSubscription.findFirst({
      where: {
        id: subscriptionId,
        consumerId: session.consumerId,
        plan: {
          businessId: business.id,
        },
      },
    });

    if (!planSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Audit log: trace who triggered cancel for future investigation
    const consumer = await prisma.consumer.findUnique({
      where: { id: session.consumerId },
      select: { email: true },
    });
    await prisma.auditLog.create({
      data: {
        businessId: business.id,
        type: "SUBSCRIPTION_CANCEL_REQUESTED",
        metadata: {
          source: "member_portal",
          consumerId: session.consumerId,
          consumerEmail: consumer?.email,
          subscriptionId,
          stripeSubscriptionId: planSubscription.stripeSubscriptionId,
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      },
    });

    // Cancel at period end in Stripe
    const stripe = getStripeClient(business.stripeAccountId);
    await stripe.subscriptions.update(planSubscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: "Customer cancelled via member portal",
      },
    });

    // Update local status
    await prisma.planSubscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription", details: error.message },
      { status: 500 }
    );
  }
}

