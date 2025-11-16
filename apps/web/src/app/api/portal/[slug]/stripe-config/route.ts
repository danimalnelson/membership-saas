import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find the business
    const business = await prisma.business.findUnique({
      where: { slug },
      select: { 
        id: true, 
        stripeAccountId: true,
      },
    });

    if (!business?.stripeAccountId) {
      return NextResponse.json(
        { error: "Business not found or Stripe not connected" },
        { status: 404 }
      );
    }

    // For connected accounts, we use the platform's publishable key
    // with the connected account ID specified (stripeAccount option)
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      return NextResponse.json(
        { error: "Stripe publishable key not configured. Please add STRIPE_PUBLISHABLE_KEY to your environment variables." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publishableKey,
      stripeAccount: business.stripeAccountId,
    });
  } catch (error) {
    console.error("[STRIPE_CONFIG_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe configuration" },
      { status: 500 }
    );
  }
}

