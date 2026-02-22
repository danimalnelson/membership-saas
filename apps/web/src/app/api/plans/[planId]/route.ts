import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { createConnectedPrice, getStripeClient } from "@wine-club/lib";
import { z } from "zod";

const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).or(z.literal("")).optional().nullable(),
  basePrice: z.union([z.number().int().positive(), z.null(), z.literal("")]).optional().nullable(),
  currency: z.string().optional(),
  interval: z.enum(["WEEK", "MONTH", "YEAR"]).optional(),
  intervalCount: z.number().int().positive().optional(),
  setupFee: z.union([z.number().int().min(0), z.null(), z.literal("")]).optional().nullable(),
  recurringFee: z.union([z.number().int().min(0), z.null(), z.literal("")]).optional().nullable(),
  recurringFeeName: z.string().max(100).or(z.literal("")).optional().nullable(),
  shippingFee: z.union([z.number().int().min(0), z.null(), z.literal("")]).optional().nullable(),
  stockStatus: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD_OUT", "COMING_SOON", "WAITLIST"]).optional(),
  maxSubscribers: z.union([z.number().int().positive(), z.null(), z.literal("")]).optional().nullable(),
});

// GET: Fetch plan details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await context.params;

    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
        business: {
          users: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        membership: true,
        _count: {
          select: {
            planSubscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Get plan error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

// PUT: Update plan
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await context.params;
    const body = await req.json();
    
    // Preprocess: Convert empty strings to null
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => {
        if (value === "") return [key, null];
        return [key, value];
      })
    );
    
    const data = updatePlanSchema.parse(cleanedBody);

    // Get existing plan and verify access
    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: planId,
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
        membership: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Plan not found or access denied" },
        { status: 404 }
      );
    }

    if (!existingPlan.business.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    const stripe = getStripeClient(existingPlan.business.stripeAccountId);

    // Update Stripe Product if name or description changed
    if (data.name || data.description !== undefined) {
      if (existingPlan.stripeProductId) {
        await stripe.products.update(existingPlan.stripeProductId, {
          name: data.name || existingPlan.name,
          description: data.description === null ? "" : (data.description || existingPlan.description || undefined),
        });
      }
    }

    let newStripePriceId: string | undefined;

    // Check if price needs to be updated (create new Price in Stripe)
    const priceChanged =
      data.basePrice !== undefined && data.basePrice !== existingPlan.basePrice;

    if (existingPlan.stripeProductId && priceChanged) {
      // Create new Stripe Price (Stripe doesn't allow price updates)
      // Use interval from membership (not from plan)
      const newPrice = await createConnectedPrice(
        existingPlan.business.stripeAccountId,
        {
          productId: existingPlan.stripeProductId,
          unitAmount: data.basePrice || existingPlan.basePrice || 0,
          currency: data.currency || existingPlan.currency,
          interval: existingPlan.membership.billingInterval.toLowerCase() as
            | "week"
            | "month"
            | "year",
          intervalCount: 1,  // Always 1
          nickname: `${data.name || existingPlan.name} - Updated`,
          metadata: {
            planName: data.name || existingPlan.name,
            membershipId: existingPlan.membershipId,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      newStripePriceId = newPrice.id;

      // Archive old price
      if (existingPlan.stripePriceId) {
        await stripe.prices.update(existingPlan.stripePriceId, {
          active: false,
        });
      }
    }

    const finalStripePriceId = newStripePriceId || existingPlan.stripePriceId;

    // Update plan in database
    // Exclude interval/intervalCount (moved to Membership model)
    const { interval, intervalCount, ...planUpdateData } = data;
    
    // Convert any remaining empty strings to null for Prisma
    const cleanedUpdateData = Object.fromEntries(
      Object.entries(planUpdateData).map(([key, value]) => [
        key,
        value === "" ? null : value
      ])
    );
    
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...cleanedUpdateData,
        stripePriceId: finalStripePriceId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        businessId: existingPlan.businessId,
        actorUserId: session.user.id,
        type: "PLAN_UPDATED",
        metadata: {
          planId: updatedPlan.id,
          planName: updatedPlan.name,
          changes: data,
          newStripePriceId: newStripePriceId,
        },
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Update plan error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update plan", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE: Archive plan
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planId } = await context.params;

    // Get plan and verify access
    const plan = await prisma.plan.findFirst({
      where: {
        id: planId,
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
        _count: {
          select: {
            planSubscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found or access denied" },
        { status: 404 }
      );
    }

    // Don't allow deletion if there are active subscriptions
    if (plan._count.planSubscriptions > 0) {
      return NextResponse.json(
        { error: "Cannot delete plan with active subscriptions. Archive it instead." },
        { status: 400 }
      );
    }

    // Archive in Stripe (don't delete, for audit trail)
    if (plan.stripeProductId && plan.business.stripeAccountId) {
      const stripe = getStripeClient(plan.business.stripeAccountId);
      await stripe.products.update(plan.stripeProductId, {
        active: false,
      });
    }

    // Archive plan in database (soft delete)
    const archivedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        status: "ARCHIVED",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        businessId: plan.businessId,
        actorUserId: session.user.id,
        type: "PLAN_ARCHIVED",
        metadata: {
          planId: plan.id,
          planName: plan.name,
        },
      },
    });

    return NextResponse.json({
      message: "Plan archived successfully",
      plan: archivedPlan,
    });
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json(
      { error: "Failed to archive plan" },
      { status: 500 }
    );
  }
}

