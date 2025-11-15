import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find consumer
    const consumer = await prisma.consumer.findUnique({
      where: { email },
      include: {
        planSubscriptions: {
          include: {
            plan: {
              include: {
                business: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!consumer) {
      return NextResponse.json({ error: "Consumer not found" }, { status: 404 });
    }

    const subscription = consumer.planSubscriptions[0];
    if (!subscription) {
      return NextResponse.json({ error: "No subscriptions found" }, { status: 404 });
    }

    const stripeAccountId = subscription.plan.business.stripeAccountId;
    if (!stripeAccountId) {
      return NextResponse.json({ error: "No Stripe account" }, { status: 404 });
    }

    // Get Stripe customer details
    const stripeCustomer = await stripe.customers.retrieve(
      subscription.stripeCustomerId,
      {
        stripeAccount: stripeAccountId,
      }
    );

    if (stripeCustomer.deleted) {
      return NextResponse.json({ error: "Customer deleted in Stripe" }, { status: 404 });
    }

    return NextResponse.json({
      database: {
        id: consumer.id,
        email: consumer.email,
        name: consumer.name,
        phone: consumer.phone,
      },
      stripe: {
        id: stripeCustomer.id,
        email: stripeCustomer.email,
        name: stripeCustomer.name,
        phone: stripeCustomer.phone,
        address: stripeCustomer.address,
        metadata: stripeCustomer.metadata,
      },
      subscription: {
        id: subscription.id,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error("Check Stripe customer error:", error);
    return NextResponse.json(
      { error: "Failed to check customer", details: error.message },
      { status: 500 }
    );
  }
}

