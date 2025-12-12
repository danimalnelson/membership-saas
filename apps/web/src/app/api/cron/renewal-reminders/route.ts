import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";
import { sendEmail, renewalReminderEmail } from "@wine-club/emails";

/**
 * Cron Job: Send renewal reminder emails
 * 
 * Runs daily at 9am UTC to send reminders to members whose subscriptions
 * will renew in 7 days.
 * 
 * Schedule: 0 9 * * * (daily at 9am UTC)
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

  console.log("[Cron] Starting renewal reminders job...");

  try {
    const publicAppUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
    
    // Find subscriptions renewing in 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNowEnd = new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000);

    const subscriptionsToRemind = await prisma.planSubscription.findMany({
      where: {
        status: "active",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          gte: sevenDaysFromNow,
          lt: sevenDaysFromNowEnd,
        },
      },
      include: {
        consumer: true,
        plan: {
          include: {
            business: true,
          },
        },
      },
    });

    console.log(`[Cron] Found ${subscriptionsToRemind.length} subscriptions renewing in 7 days`);

    let sentCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptionsToRemind) {
      try {
        const renewalDate = subscription.currentPeriodEnd;
        const amount = subscription.plan.basePrice || 0;
        const currency = subscription.plan.currency || "usd";
        const daysUntilRenewal = Math.ceil(
          (renewalDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        await sendEmail({
          to: subscription.consumer.email,
          subject: `Subscription Renewal Reminder - ${subscription.plan.business.name}`,
          html: renewalReminderEmail({
            customerName: subscription.consumer.name || "Valued Member",
            planName: subscription.plan.name,
            renewalDate: renewalDate.toLocaleDateString(),
            amount,
            currency,
            businessName: subscription.plan.business.name,
            portalUrl: `${publicAppUrl}/${subscription.plan.business.slug}/portal`,
            daysUntilRenewal,
          }),
        });

        sentCount++;
        console.log(`[Cron] ✉️ Sent renewal reminder to ${subscription.consumer.email}`);
      } catch (error) {
        errorCount++;
        console.error(`[Cron] Failed to send reminder to ${subscription.consumer.email}:`, error);
      }
    }

    console.log(`[Cron] Renewal reminders complete: ${sentCount} sent, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      processed: subscriptionsToRemind.length,
      sent: sentCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("[Cron] Renewal reminders job failed:", error);
    return NextResponse.json(
      { error: "Job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
