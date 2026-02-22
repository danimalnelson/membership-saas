import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "the-ruby-tap";

    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        memberships: {
          include: {
            plans: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const plansSummary = business.memberships.flatMap((membership) =>
      membership.plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        membershipName: membership.name,
        status: plan.status,
        stockStatus: plan.stockStatus,
        basePrice: plan.basePrice,
        createdAt: plan.createdAt,
        listedOnPublicPage: plan.status === "ACTIVE",
        purchasable:
          plan.status === "ACTIVE" &&
          plan.stockStatus !== "SOLD_OUT" &&
          plan.stockStatus !== "COMING_SOON" &&
          plan.stockStatus !== "UNAVAILABLE",
      }))
    );

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      allPlans: plansSummary,
      listedPlans: plansSummary.filter((p) => p.listedOnPublicPage),
      purchasablePlans: plansSummary.filter((p) => p.purchasable),
      help: {
        message:
          "Plans are listed when status='ACTIVE'. Plans are purchasable when listed and stockStatus is not SOLD_OUT, COMING_SOON, or UNAVAILABLE.",
        publicPageUrl: `${process.env.PUBLIC_APP_URL || "https://membership-saas-web.vercel.app"}/${slug}`,
      },
    });
  } catch (error: any) {
    console.error("Plan visibility debug error:", error);
    return NextResponse.json(
      { error: "Failed to check plan visibility", details: error.message },
      { status: 500 }
    );
  }
}

