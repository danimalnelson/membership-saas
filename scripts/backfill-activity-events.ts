/**
 * Backfill Script: Populate Transaction records from existing PlanSubscription data
 *
 * This script creates SUBSCRIPTION_CREATED and SUBSCRIPTION_CANCELLED transaction
 * records for all existing PlanSubscriptions, so they appear in the activity feed.
 *
 * Run once after deploying the schema changes:
 *
 *   cd packages/db
 *   DATABASE_URL='...' DIRECT_URL='...' npx tsx ../../scripts/backfill-activity-events.ts
 *
 * Or from the project root with env vars loaded:
 *
 *   npx tsx scripts/backfill-activity-events.ts
 *
 * The script is idempotent — it skips records that already exist by checking
 * for duplicate planSubscriptionId + type combinations.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting activity event backfill...\n");

  // Fetch all PlanSubscriptions with their plan and consumer
  const planSubscriptions = await prisma.planSubscription.findMany({
    include: {
      plan: {
        select: {
          businessId: true,
          name: true,
          currency: true,
        },
      },
      consumer: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  console.log(`Found ${planSubscriptions.length} PlanSubscriptions to process.\n`);

  let createdCount = 0;
  let cancelledCount = 0;
  let skippedCount = 0;

  for (const sub of planSubscriptions) {
    // Check if SUBSCRIPTION_CREATED already exists for this planSubscription
    const existingCreated = await prisma.transaction.findFirst({
      where: {
        planSubscriptionId: sub.id,
        type: "SUBSCRIPTION_CREATED",
      },
    });

    if (!existingCreated) {
      await prisma.transaction.create({
        data: {
          businessId: sub.plan.businessId,
          consumerId: sub.consumer.id,
          planSubscriptionId: sub.id,
          amount: 0,
          currency: sub.plan.currency || "usd",
          type: "SUBSCRIPTION_CREATED",
          description: sub.plan.name,
          createdAt: sub.createdAt, // Use the original subscription creation date
        },
      });
      createdCount++;
    } else {
      skippedCount++;
    }

    // If subscription is canceled, create SUBSCRIPTION_CANCELLED record
    if (sub.status === "canceled") {
      const existingCancelled = await prisma.transaction.findFirst({
        where: {
          planSubscriptionId: sub.id,
          type: "SUBSCRIPTION_CANCELLED",
        },
      });

      if (!existingCancelled) {
        await prisma.transaction.create({
          data: {
            businessId: sub.plan.businessId,
            consumerId: sub.consumer.id,
            planSubscriptionId: sub.id,
            amount: 0,
            currency: sub.plan.currency || "usd",
            type: "SUBSCRIPTION_CANCELLED",
            description: sub.plan.name,
            createdAt: sub.lastSyncedAt, // Use lastSyncedAt as approximate cancellation date
          },
        });
        cancelledCount++;
      } else {
        skippedCount++;
      }
    }

    // If subscription is paused, create SUBSCRIPTION_PAUSED record
    if (sub.pausedAt) {
      const existingPaused = await prisma.transaction.findFirst({
        where: {
          planSubscriptionId: sub.id,
          type: "SUBSCRIPTION_PAUSED",
        },
      });

      if (!existingPaused) {
        await prisma.transaction.create({
          data: {
            businessId: sub.plan.businessId,
            consumerId: sub.consumer.id,
            planSubscriptionId: sub.id,
            amount: 0,
            currency: sub.plan.currency || "usd",
            type: "SUBSCRIPTION_PAUSED",
            description: sub.plan.name,
            createdAt: sub.pausedAt,
          },
        });
      }
    }
  }

  // Also backfill description on existing CHARGE transactions that are missing it
  console.log("\nBackfilling descriptions on existing CHARGE transactions...");

  const chargesWithoutDescription = await prisma.transaction.findMany({
    where: {
      type: "CHARGE",
      description: null,
      subscriptionId: { not: null },
    },
    include: {
      subscription: {
        include: {
          membershipPlan: { select: { name: true } },
        },
      },
    },
  });

  let descriptionCount = 0;
  for (const tx of chargesWithoutDescription) {
    if (tx.subscription?.membershipPlan?.name) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { description: tx.subscription.membershipPlan.name },
      });
      descriptionCount++;
    }
  }

  console.log(`\n--- Backfill Complete ---`);
  console.log(`SUBSCRIPTION_CREATED records created: ${createdCount}`);
  console.log(`SUBSCRIPTION_CANCELLED records created: ${cancelledCount}`);
  console.log(`Skipped (already existed): ${skippedCount}`);
  console.log(`CHARGE descriptions backfilled: ${descriptionCount}`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
