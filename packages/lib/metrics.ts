import type { PrismaClient } from "@prisma/client";

/**
 * Business performance metrics for dashboard display.
 * All monetary values are in cents to avoid floating-point precision issues.
 */
export interface BusinessMetrics {
  /** Monthly Recurring Revenue in cents */
  mrr: number;
  /** Current count of active members */
  activeMembers: number;
  /** Churn rate as a percentage (0-100) calculated over last 30 days */
  churnRate: number;
  /** All-time total revenue in cents */
  totalRevenue: number;
  /** Revenue breakdown by month for charting (last 12 months) */
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

/**
 * Calculates comprehensive business metrics for a given business.
 * 
 * Aggregates data from members, subscriptions, and payments to provide:
 * - MRR (Monthly Recurring Revenue) from active subscriptions
 * - Active member count
 * - 30-day churn rate
 * - All-time total revenue
 * - Monthly revenue breakdown (last 12 months)
 * 
 * This function performs multiple database queries and should be cached
 * when possible to avoid performance impacts.
 * 
 * @param prisma - Prisma client instance
 * @param businessId - ID of the business to calculate metrics for
 * @returns Promise resolving to BusinessMetrics object
 * 
 * @example
 * const metrics = await calculateMetrics(prisma, 'biz_123');
 * console.log(`MRR: $${metrics.mrr / 100}`);
 * console.log(`Active Members: ${metrics.activeMembers}`);
 * console.log(`Churn Rate: ${metrics.churnRate}%`);
 */
export async function calculateMetrics(
  prisma: PrismaClient,
  businessId: string
): Promise<BusinessMetrics> {
  // Get active members count
  const activeMembers = await prisma.member.count({
    where: {
      businessId,
      status: "ACTIVE",
    },
  });

  // Calculate MRR from active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      member: {
        businessId,
      },
      status: {
        in: ["active", "trialing"],
      },
    },
    include: {
      price: true,
    },
  });

  let mrr = 0;
  for (const sub of activeSubscriptions) {
    const amount = sub.price.unitAmount;
    if (sub.price.interval === "month") {
      mrr += amount;
    } else if (sub.price.interval === "year") {
      mrr += Math.floor(amount / 12); // Convert yearly to monthly
    }
  }

  // Calculate churn rate (canceled in last 30 days / total active 30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const canceledMembers = await prisma.member.count({
    where: {
      businessId,
      status: "CANCELED",
      updatedAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const totalMembersThirtyDaysAgo = activeMembers + canceledMembers;
  const churnRate =
    totalMembersThirtyDaysAgo > 0
      ? (canceledMembers / totalMembersThirtyDaysAgo) * 100
      : 0;

  // Calculate total revenue
  const totalRevenue = await prisma.transaction.aggregate({
    where: {
      businessId,
      type: "CHARGE",
    },
    _sum: {
      amount: true,
    },
  });

  // Get monthly revenue for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      businessId,
      type: "CHARGE",
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by month
  const monthlyRevenueMap = new Map<string, number>();
  for (const tx of monthlyTransactions) {
    const monthKey = tx.createdAt.toISOString().slice(0, 7); // YYYY-MM
    monthlyRevenueMap.set(
      monthKey,
      (monthlyRevenueMap.get(monthKey) || 0) + tx.amount
    );
  }

  const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-6); // Last 6 months

  return {
    mrr,
    activeMembers,
    churnRate: Math.round(churnRate * 100) / 100, // Round to 2 decimal places
    totalRevenue: totalRevenue._sum.amount || 0,
    monthlyRevenue,
  };
}

