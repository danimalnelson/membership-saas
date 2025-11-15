import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { createCustomerPortalLink } from "@wine-club/lib";
import { z } from "zod";

const createPortalLinkSchema = z.object({
  consumerEmail: z.string().email(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { consumerEmail } = createPortalLinkSchema.parse(body);

    // Find business
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business || !business.stripeAccountId) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Find consumer
    const consumer = await prisma.consumer.findUnique({
      where: { email: consumerEmail },
    });

    if (!consumer) {
      return NextResponse.json({ error: "Consumer not found" }, { status: 404 });
    }

    // Find active PlanSubscription for this consumer and business
    const planSubscription = await prisma.planSubscription.findFirst({
      where: {
        consumerId: consumer.id,
        plan: {
          businessId: business.id,
        },
        status: {
          in: ["active", "trialing", "past_due", "incomplete"],
        },
      },
      include: {
        plan: true,
      },
    });

    if (!planSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Use stripeCustomerId from PlanSubscription
    const customerId = planSubscription.stripeCustomerId;

    const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
    
    const portalUrl = await createCustomerPortalLink({
      accountId: business.stripeAccountId,
      customerId,
      returnUrl: `${publicAppUrl}/${slug}/portal`,
    });

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error("Portal link error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create portal link" },
      { status: 500 }
    );
  }
}

