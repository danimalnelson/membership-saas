import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { createConnectedProduct, createConnectedPrice } from "@wine-club/lib";
import { z } from "zod";

const createPlanSchema = z.object({
  membershipId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  pricingType: z.enum(["FIXED", "DYNAMIC"]),
  basePrice: z.number().int().positive().optional().nullable(), // In cents
  currency: z.string().default("usd"),
  interval: z.enum(["WEEK", "MONTH", "YEAR"]),
  intervalCount: z.number().int().positive().default(1),
  quantityPerShipment: z.number().int().positive().optional().nullable(),
  productType: z.string().max(100).optional().nullable(),
  setupFee: z.number().int().min(0).optional().nullable(),
  shippingType: z.enum(["INCLUDED", "FLAT_RATE", "CALCULATED", "FREE_OVER_AMOUNT"]).default("INCLUDED"),
  shippingCost: z.number().int().min(0).optional().nullable(),
  trialPeriodDays: z.number().int().min(0).optional().nullable(),
  minimumCommitmentMonths: z.number().int().min(0).optional().nullable(),
  stockStatus: z.enum(["AVAILABLE", "SOLD_OUT", "COMING_SOON", "WAITLIST"]).default("AVAILABLE"),
  maxSubscribers: z.number().int().positive().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createPlanSchema.parse(body);

    // Get membership and verify user has access
    const membership = await prisma.membership.findFirst({
      where: {
        id: data.membershipId,
        business: {
          users: {
            some: {
              userId: session.user.id,
              role: {
                in: ["OWNER", "ADMIN"],
              },
            },
          },
        },
      },
      include: {
        business: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found or access denied" },
        { status: 404 }
      );
    }

    if (!membership.business.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    // Validation: Fixed pricing requires basePrice
    if (data.pricingType === "FIXED" && !data.basePrice) {
      return NextResponse.json(
        { error: "Fixed pricing requires a base price" },
        { status: 400 }
      );
    }

    // Create Stripe Product on connected account
    const stripeProduct = await createConnectedProduct(
      membership.business.stripeAccountId,
      {
        name: data.name,
        description: data.description || undefined,
        metadata: {
          businessId: membership.businessId,
          membershipId: membership.id,
          pricingType: data.pricingType,
        },
      }
    );

    // Create Stripe Price if fixed pricing
    let stripePriceId: string | undefined;
    if (data.pricingType === "FIXED" && data.basePrice) {
      const stripePrice = await createConnectedPrice(
        membership.business.stripeAccountId,
        {
          productId: stripeProduct.id,
          unitAmount: data.basePrice,
          currency: data.currency,
          interval: data.interval.toLowerCase() as "week" | "month" | "year",
          intervalCount: data.intervalCount,
          nickname: `${data.name} - ${data.intervalCount} ${data.interval.toLowerCase()}${data.intervalCount > 1 ? "s" : ""}`,
          trialPeriodDays: data.trialPeriodDays || undefined,
          metadata: {
            planName: data.name,
            membershipId: membership.id,
          },
        }
      );
      stripePriceId = stripePrice.id;
    }

    // Create plan in database
    const plan = await prisma.plan.create({
      data: {
        businessId: membership.businessId,
        membershipId: membership.id,
        name: data.name,
        description: data.description,
        pricingType: data.pricingType,
        basePrice: data.basePrice,
        currency: data.currency,
        interval: data.interval,
        intervalCount: data.intervalCount,
        quantityPerShipment: data.quantityPerShipment,
        productType: data.productType,
        setupFee: data.setupFee,
        shippingType: data.shippingType,
        shippingCost: data.shippingCost,
        trialPeriodDays: data.trialPeriodDays,
        minimumCommitmentMonths: data.minimumCommitmentMonths,
        stockStatus: data.stockStatus,
        maxSubscribers: data.maxSubscribers,
        status: data.status,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePriceId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        businessId: membership.businessId,
        actorUserId: session.user.id,
        type: "PLAN_CREATED",
        metadata: {
          planId: plan.id,
          planName: plan.name,
          membershipId: membership.id,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePriceId,
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Create plan error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create plan", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
