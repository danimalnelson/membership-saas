import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { sendBusinessEmail, monthlySummaryEmail } from "@wine-club/emails";

/**
 * Cron Job: Send monthly summary emails to business owners
 * 
 * Runs on the 1st of each month at 10am UTC to send business owners
 * a summary of the previous month's performance.
 * 
 * Schedule: 0 10 1 * * (1st of month at 10am UTC)
 */
export async function GET(req: NextRequest) {
  // Verify cron secret for security (Vercel cron jobs include this header)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log("[Cron] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Starting monthly summaries job...");

  try {
    const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

    // Calculate last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const monthName = lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Get all active businesses with contact emails
    const businesses = await prisma.business.findMany({
      where: {
        status: "ONBOARDING_COMPLETE",
        contactEmail: { not: null },
      },
      include: {
        plans: {
          include: {
            planSubscriptions: true,
          },
        },
      },
    });

    console.log(`[Cron] Processing ${businesses.length} businesses for monthly summary`);

    let sentCount = 0;
    let errorCount = 0;

    for (const business of businesses) {
      try {
        // Calculate metrics for this business
        const allSubscriptions = business.plans.flatMap((p) => p.planSubscriptions);
        
        // New members last month
        const newMembers = await prisma.planSubscription.count({
          where: {
            plan: { businessId: business.id },
            createdAt: {
              gte: lastMonth,
              lte: lastMonthEnd,
            },
          },
        });

        // Churned members last month (those who cancelled)
        const churned = await prisma.planSubscription.count({
          where: {
            plan: { businessId: business.id },
            status: "canceled",
            updatedAt: {
              gte: lastMonth,
              lte: lastMonthEnd,
            },
          },
        });

        // Current active members
        const totalActiveMembers = await prisma.planSubscription.count({
          where: {
            plan: { businessId: business.id },
            status: { in: ["active", "trialing"] },
          },
        });

        // Revenue last month
        const transactions = await prisma.transaction.aggregate({
          where: {
            businessId: business.id,
            type: "CHARGE",
            createdAt: {
              gte: lastMonth,
              lte: lastMonthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const revenue = transactions._sum.amount || 0;

        // Find top plan
        const planCounts = await prisma.planSubscription.groupBy({
          by: ["planId"],
          where: {
            plan: { businessId: business.id },
            status: { in: ["active", "trialing"] },
          },
          _count: { planId: true },
          orderBy: {
            _count: { planId: "desc" },
          },
          take: 1,
        });

        let topPlan: string | undefined;
        if (planCounts.length > 0) {
          const topPlanData = await prisma.plan.findUnique({
            where: { id: planCounts[0].planId },
          });
          topPlan = topPlanData?.name;
        }

        // Send summary email
        await sendBusinessEmail(
          business.contactEmail,
          `${monthName} Summary - ${business.name}`,
          monthlySummaryEmail({
            businessName: business.name,
            month: monthName,
            newMembers,
            churned,
            totalActiveMembers,
            revenue,
            currency: business.currency || "USD",
            topPlan,
            dashboardUrl: `${publicAppUrl}/dashboard/${business.slug}/analytics`,
          })
        );

        sentCount++;
        console.log(`[Cron] ✉️ Sent monthly summary to ${business.contactEmail}`);
      } catch (error) {
        errorCount++;
        console.error(`[Cron] Failed to send summary to ${business.contactEmail}:`, error);
      }
    }

    console.log(`[Cron] Monthly summaries complete: ${sentCount} sent, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      month: monthName,
      processed: businesses.length,
      sent: sentCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("[Cron] Monthly summaries job failed:", error);
    return NextResponse.json(
      { error: "Job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
