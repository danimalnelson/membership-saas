# 🔴 STRIPE-NATIVE ARCHITECTURE

**Date:** November 13, 2025  
**Status:** ✅ **Mission Updated, Ready for Phase 0**

---

## 🎯 Core Philosophy

**Stripe is the source of truth for ALL billing, subscriptions, and payment logic.**

Our application:
- ✅ Orchestrates Stripe API calls
- ✅ Caches Stripe data for performance
- ✅ Stores business logic (preferences, rules)
- ❌ **NEVER** duplicates billing calculations
- ❌ **NEVER** implements payment retry logic
- ❌ **NEVER** calculates billing dates manually

---

## 📋 What Changed

### 1. Mission File Updated
**File:** `agents/mission.subscription-modeling.md`

**Added:**
- 🔴 Stripe-Native Architecture section (top of file)
- Phase 0: Stripe Code Audit (NEW - must complete first)
- Stripe implementation examples (✅ vs ❌)
- Updated all phases to be Stripe-first

**Key Principle:**
> Stripe handles: subscriptions, billing, trials, pauses, retries, invoices, proration  
> We handle: memberships, preferences, business rules

---

### 2. Simplified Data Model

**Old Approach (Custom Logic):**
```prisma
model PlanSubscription {
  // Custom billing logic ❌
  nextBillingDate     DateTime
  billingCycleAnchor  Int
  pausedAt            DateTime
  resumedAt           DateTime
  // ... lots of date tracking
}
```

**New Approach (Stripe-Native):**
```prisma
model PlanSubscription {
  // Just Stripe ID ✅
  stripeSubscriptionId String @unique
  stripeCustomerId     String
  
  // Minimal cache (from webhooks) ✅
  status               String   // Mirror Stripe
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  
  // Business logic only ✅
  preferences          Json?
  giftFrom             String?
}
```

**Result:** 60% fewer fields, Stripe does the work

---

### 3. Phase 0: Stripe Audit Added

**NEW Critical Phase:**

Before implementing new subscriptions, we must:
1. Audit ALL existing Stripe code
2. Identify anti-patterns (custom billing logic)
3. Document what needs refactoring
4. Create migration plan

**Files to Audit:**
- `apps/web/src/app/api/checkout/*`
- `apps/web/src/app/api/stripe/*`
- `apps/web/src/app/api/stripe/webhook/route.ts`
- `packages/lib/stripe.ts`
- Current `Subscription` model usage

**Output:** `logs/stripe-audit-YYYY-MM-DD.md`

---

## 💻 Implementation Examples

### Creating Subscriptions

```typescript
// ✅ GOOD: Let Stripe handle it
const subscription = await stripe.subscriptions.create({
  customer: consumer.stripeCustomerId,
  items: [{ price: plan.stripePriceId }],
  
  // Billing anchor for NEXT_INTERVAL
  billing_cycle_anchor: membership.billingAnchor === 'NEXT_INTERVAL'
    ? calculateNextCohortDate(membership.cohortBillingDay)
    : undefined,
  
  // Trial
  trial_period_days: plan.trialPeriodDays,
  
  // Our metadata
  metadata: {
    planId: plan.id,
    preferences: JSON.stringify(preferences),
  },
});

// Store minimal data in DB
await db.planSubscription.create({
  stripeSubscriptionId: subscription.id,
  planId: plan.id,
  consumerId: consumer.id,
  status: subscription.status,  // Cache from Stripe
  currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  preferences,
});
```

### Pausing Subscriptions

```typescript
// ✅ GOOD: Use Stripe's pause_collection
await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
  pause_collection: { behavior: 'void' },
});

// Webhook automatically updates our DB
```

### Dynamic Pricing

```typescript
// ✅ GOOD: Create new Stripe Price
const newPrice = await stripe.prices.create({
  product: plan.stripeProductId,
  unit_amount: newPriceInCents,
  currency: 'usd',
  recurring: {
    interval: plan.interval.toLowerCase(),
    interval_count: plan.intervalCount,
  },
});

// Update subscription (takes effect next billing)
await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
  items: [{
    id: subscription.items.data[0].id,
    price: newPrice.id,
  }],
  proration_behavior: 'none',
});
```

---

## 🔄 Next Steps

### Immediate (Phase 0)

1. ✅ Run Stripe code audit
2. ✅ Document current architecture
3. ✅ Identify anti-patterns
4. ✅ Create refactoring plan

### Then (Phase 1)

5. Update schema with Stripe-native models
6. Generate migration
7. Test locally

### Future Phases

- Phase 2: Implement Stripe integration
- Phase 3: Build business UI
- Phase 4: Build consumer UI
- Phase 5: Automation

---

## 📚 Resources

**Mission File:** `agents/mission.subscription-modeling.md`  
**Audit Log:** `logs/subscription-modeling-audit-2025-11-13.md`  
**Branch:** `feature/subscription-modeling-phase1`

**Stripe Docs:**
- [Subscriptions API](https://stripe.com/docs/api/subscriptions)
- [Billing Cycle Anchor](https://stripe.com/docs/billing/subscriptions/billing-cycle)
- [Pause Collection](https://stripe.com/docs/billing/subscriptions/pause)
- [Webhooks](https://stripe.com/docs/webhooks)

---

## ✅ Benefits of Stripe-Native

1. **Reliability:** Stripe's battle-tested logic
2. **Features:** Automatic retries, dunning, invoices
3. **Compliance:** PCI DSS handled by Stripe
4. **Simplicity:** Less code to maintain
5. **Accuracy:** No sync issues, single source of truth
6. **Future-proof:** New Stripe features work automatically

---

> **Remember: If Stripe can do it, let Stripe do it. We orchestrate, we don't duplicate.** 🚀

