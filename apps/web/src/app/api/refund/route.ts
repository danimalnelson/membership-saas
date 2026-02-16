import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { refundableId } = await req.json();

    if (!refundableId || typeof refundableId !== "string") {
      return NextResponse.json({ error: "Missing refundableId" }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // Route 1: Refund via local Transaction record
    if (refundableId.startsWith("tx:")) {
      const transactionId = refundableId.slice(3);
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          business: {
            include: {
              users: {
                where: {
                  userId: session.user.id,
                  role: { in: ["OWNER", "ADMIN"] },
                },
              },
            },
          },
        },
      });

      if (!transaction) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }
      if (transaction.business.users.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (transaction.type !== "CHARGE") {
        return NextResponse.json({ error: "Only charges can be refunded" }, { status: 400 });
      }

      const refundParams: Stripe.RefundCreateParams = {};
      if (transaction.stripeChargeId) {
        refundParams.charge = transaction.stripeChargeId;
      } else if (transaction.stripePaymentIntentId) {
        refundParams.payment_intent = transaction.stripePaymentIntentId;
      } else {
        return NextResponse.json({ error: "No Stripe payment reference" }, { status: 400 });
      }

      await stripe.refunds.create(refundParams, {
        stripeAccount: transaction.business.stripeAccountId || undefined,
      });

      return NextResponse.json({ success: true });
    }

    // Route 2: Refund via Stripe subscription (find the latest paid invoice)
    if (refundableId.startsWith("sub:")) {
      const stripeSubscriptionId = refundableId.slice(4);

      const planSubscription = await prisma.planSubscription.findUnique({
        where: { stripeSubscriptionId },
        include: {
          plan: {
            include: {
              business: {
                include: {
                  users: {
                    where: {
                      userId: session.user.id,
                      role: { in: ["OWNER", "ADMIN"] },
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
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const stripeAccountId = planSubscription.plan.business.stripeAccountId;

      // Find the latest paid invoice for this subscription
      const invoices = await stripe.invoices.list(
        {
          subscription: stripeSubscriptionId,
          status: "paid",
          limit: 1,
        },
        { stripeAccount: stripeAccountId || undefined }
      );

      if (invoices.data.length === 0) {
        return NextResponse.json({ error: "No paid invoice found for this subscription" }, { status: 400 });
      }

      const invoice = invoices.data[0];
      const paymentIntent = invoice.payment_intent;

      if (!paymentIntent) {
        return NextResponse.json({ error: "No payment intent on invoice" }, { status: 400 });
      }

      const piId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;

      await stripe.refunds.create(
        { payment_intent: piId },
        { stripeAccount: stripeAccountId || undefined }
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid refundableId format" }, { status: 400 });
  } catch (error: any) {
    console.error("[API] Refund error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
