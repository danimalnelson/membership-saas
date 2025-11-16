/**
 * Helpers for Multi-Plan Checkout
 * 
 * Handles the case where a single Stripe subscription has multiple line items,
 * which we need to map to multiple PlanSubscription records.
 */

import Stripe from "stripe";
import { sendEmail } from "./email";

/**
 * Check if a checkout session is for multiple plans
 */
export function isMultiPlanCheckout(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.isMultiPlan === 'true';
}

/**
 * Get plan IDs from a multi-plan checkout session
 */
export function getPlanIdsFromSession(session: Stripe.Checkout.Session): string[] {
  const planIdsStr = session.metadata?.planIds;
  if (!planIdsStr) return [];
  return planIdsStr.split(',').filter(Boolean);
}

/**
 * Create multiple PlanSubscription records from a single Stripe subscription
 * 
 * This is used when a checkout has multiple line items (multiple plans).
 * Stripe creates ONE subscription with multiple line items, but we need
 * multiple PlanSubscription records in our database.
 * 
 * @param prisma - Prisma client
 * @param session - Stripe checkout session
 * @param subscription - Stripe subscription (has multiple line items)
 * @param accountId - Connected account ID
 */
export async function createMultiplePlanSubscriptions(
  prisma: any,
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
  accountId?: string
): Promise<void> {
  const planIds = getPlanIdsFromSession(session);
  
  if (planIds.length === 0) {
    throw new Error("No plan IDs found in multi-plan checkout session");
  }

  console.log(`[MultiPlan] Creating ${planIds.length} PlanSubscriptions for subscription ${subscription.id}`);

  // Get all plans
  const plans = await prisma.plan.findMany({
    where: { id: { in: planIds } },
    include: { business: true },
  });

  if (plans.length !== planIds.length) {
    throw new Error(`Found ${plans.length} plans but expected ${planIds.length}`);
  }

  // Get customer email
  const customerEmail = typeof session.customer_details?.email === 'string'
    ? session.customer_details.email
    : null;

  if (!customerEmail) {
    throw new Error("No customer email in session");
  }

  // Find or create consumer
  let consumer = await prisma.consumer.findUnique({
    where: { email: customerEmail },
  });

  if (!consumer) {
    consumer = await prisma.consumer.create({
      data: {
        email: customerEmail,
        name: session.customer_details?.name || null,
        phone: session.customer_details?.phone || null,
      },
    });
    console.log(`[MultiPlan] Created consumer ${consumer.id} for ${customerEmail}`);
  }

  // Create a PlanSubscription for EACH plan
  // NOTE: They all share the same Stripe subscription ID, but we differentiate by planId
  const createdSubscriptions = [];

  for (const plan of plans) {
    // Check if this plan's subscription already exists
    const existing = await prisma.planSubscription.findFirst({
      where: {
        consumerId: consumer.id,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
      },
    });

    if (existing) {
      console.log(`[MultiPlan] PlanSubscription already exists for plan ${plan.id}`);
      continue;
    }

    const planSubscription = await prisma.planSubscription.create({
      data: {
        planId: plan.id,
        consumerId: consumer.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        lastSyncedAt: new Date(),
      },
    });

    createdSubscriptions.push({ plan, planSubscription });
    console.log(`[MultiPlan] ✅ Created PlanSubscription ${planSubscription.id} for plan ${plan.name}`);
  }

  // Send confirmation email(s)
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    try {
      const planNames = plans.map(p => p.name).join(', ');
      const businessName = plans[0].business.name;

      await sendEmail({
        to: customerEmail,
        subject: `Welcome to ${businessName}!`,
        text: `Your subscriptions to ${planNames} are now active.`,
        html: `
          <h1>Welcome to ${businessName}!</h1>
          <p>Your subscriptions are now active:</p>
          <ul>
            ${plans.map(p => `<li><strong>${p.name}</strong></li>`).join('')}
          </ul>
          <p>Thank you for subscribing!</p>
        `,
      });

      console.log(`[MultiPlan] ✅ Sent confirmation email to ${customerEmail}`);
    } catch (emailError) {
      console.error(`[MultiPlan] ❌ Failed to send email:`, emailError);
    }
  }
}

/**
 * Handle updates to a multi-plan subscription
 * 
 * When a Stripe subscription with multiple line items is updated,
 * we need to update ALL corresponding PlanSubscription records.
 */
export async function syncMultiplePlanSubscriptions(
  prisma: any,
  subscription: Stripe.Subscription
): Promise<void> {
  // Find all PlanSubscriptions for this Stripe subscription
  const planSubscriptions = await prisma.planSubscription.findMany({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (planSubscriptions.length === 0) {
    console.log(`[MultiPlan] No PlanSubscriptions found for subscription ${subscription.id}`);
    return;
  }

  console.log(`[MultiPlan] Syncing ${planSubscriptions.length} PlanSubscriptions for subscription ${subscription.id}`);

  // Update each one with the latest Stripe data
  for (const planSub of planSubscriptions) {
    await prisma.planSubscription.update({
      where: { id: planSub.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        pausedAt: subscription.pause_collection ? new Date() : null,
        lastSyncedAt: new Date(),
      },
    });
  }

  console.log(`[MultiPlan] ✅ Synced ${planSubscriptions.length} PlanSubscriptions`);
}

/**
 * Handle deletion of a multi-plan subscription
 * 
 * When a Stripe subscription with multiple line items is deleted/canceled,
 * we need to update ALL corresponding PlanSubscription records.
 */
export async function deleteMultiplePlanSubscriptions(
  prisma: any,
  subscription: Stripe.Subscription
): Promise<void> {
  const planSubscriptions = await prisma.planSubscription.findMany({
    where: { stripeSubscriptionId: subscription.id },
  });

  console.log(`[MultiPlan] Marking ${planSubscriptions.length} PlanSubscriptions as canceled`);

  for (const planSub of planSubscriptions) {
    await prisma.planSubscription.update({
      where: { id: planSub.id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: true,
        lastSyncedAt: new Date(),
      },
    });
  }

  console.log(`[MultiPlan] ✅ Canceled ${planSubscriptions.length} PlanSubscriptions`);
}


