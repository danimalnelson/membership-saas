import { NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { getStripeClient } from "@wine-club/lib";

export async function POST() {
  try {
    const email = "dannelson@icloud.com";
    const business = await prisma.business.findUnique({
      where: { slug: "the-ruby-tap" },
    });

    if (!business || !business.stripeAccountId) {
      return NextResponse.json({ error: "Business not found" });
    }

    const stripe = getStripeClient(business.stripeAccountId);
    const updated = [];

    // Get all subscriptions for this email
    const subscriptions = await prisma.planSubscription.findMany({
      where: {
        consumer: { email },
        plan: { businessId: business.id },
      },
    });

    for (const sub of subscriptions) {
      try {
        // Get latest status from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
        
        // Update if different
        if (stripeSub.status !== sub.status) {
          await prisma.planSubscription.update({
            where: { id: sub.id },
            data: {
              status: stripeSub.status,
              currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              lastSyncedAt: new Date(),
            },
          });
          
          updated.push({
            subscriptionId: sub.stripeSubscriptionId,
            from: sub.status,
            to: stripeSub.status,
          });
        }
      } catch (error: any) {
        console.error(`Failed to sync ${sub.stripeSubscriptionId}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      updated: updated.length,
      details: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

