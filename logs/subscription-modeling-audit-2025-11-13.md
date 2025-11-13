# Subscription Modeling - Phase 1 Audit

**Date:** November 13, 2025  
**Branch:** `feature/subscription-modeling-phase1`  
**Mission:** `agents/mission.subscription-modeling.md`

---

## 🔍 Current Schema Audit

### Existing Models Related to Subscriptions

#### **MembershipPlan** (Lines 175-193)
```prisma
model MembershipPlan {
  id              String     @id @default(cuid())
  businessId      String
  name            String
  description     String?
  status          PlanStatus @default(ACTIVE)
  benefits        Json?
  stripeProductId String?
  prices          Price[]
  subscriptions   Subscription[]
}
```

**Current State:**
- ✅ Basic name, description
- ✅ Stripe integration (stripeProductId)
- ✅ Benefits (Json)
- ✅ Status (ACTIVE/ARCHIVED)
- ❌ No concept of "Membership" vs "Plan"
- ❌ No billing anchor settings
- ❌ No member rules (exclusivity, max members)
- ❌ No pause/skip settings
- ❌ No gift options

**Gap:** This model conflates "Membership" (collection) with "Plan" (individual offering)

---

#### **Price** (Lines 201-220)
```prisma
model Price {
  id               String   @id @default(cuid())
  membershipPlanId String
  nickname         String?
  interval         Interval  // month, year only
  unitAmount       Int
  currency         String @default("USD")
  trialDays        Int?
  stripePriceId    String?
  isDefault        Boolean @default(false)
  subscriptions    Subscription[]
}

enum Interval {
  month
  year
}
```

**Current State:**
- ✅ Basic pricing (unitAmount, currency)
- ✅ Interval (month, year)
- ✅ Trial period (trialDays)
- ✅ Stripe integration (stripePriceId)
- ❌ No intervalCount (can't do "every 3 months")
- ❌ No week interval
- ❌ No fixed vs dynamic pricing distinction
- ❌ No setup fees
- ❌ No shipping costs
- ❌ No product details (quantity, type)

**Gap:** Price is separate from Plan, but our new model needs Plan to own its pricing

---

#### **Subscription** (Lines 275-295)
```prisma
model Subscription {
  id                   String             @id @default(cuid())
  memberId             String
  membershipPlanId     String
  priceId              String
  stripeSubscriptionId String             @unique
  currentPeriodEnd     DateTime
  status               SubscriptionStatus
  transactions         Transaction[]
}

enum SubscriptionStatus {
  active
  trialing
  past_due
  canceled
  unpaid
  incomplete
  incomplete_expired
  paused  // ✅ Already has paused!
}
```

**Current State:**
- ✅ Links to Member, MembershipPlan, Price
- ✅ Stripe integration
- ✅ Status (includes paused)
- ❌ No currentPeriodStart
- ❌ No nextBillingDate
- ❌ No billingCycleAnchor (for IMMEDIATE billing)
- ❌ No pause tracking (pausedAt, resumedAt)
- ❌ No currentPrice tracking
- ❌ Status uses lowercase (inconsistent with rest of schema)

**Gap:** Missing billing date tracking and pause/resume history

---

#### **Member** (Lines 247-266)
```prisma
model Member {
  id         String       @id @default(cuid())
  businessId String
  consumerId String
  status     MemberStatus @default(ACTIVE)
  subscriptions Subscription[]
}

enum MemberStatus {
  ACTIVE
  PAST_DUE
  CANCELED
}
```

**Current State:**
- ✅ Links Consumer to Business
- ✅ Has subscriptions array
- ❌ Status here might conflict with Subscription status
- ❌ No concept of membership preferences

**Note:** Our new model will track status on Subscription, not Member

---

### Missing Models

1. **Membership** (collection of plans with rules)
   - Doesn't exist - currently conflated with MembershipPlan
   
2. **Plan** (individual offering within membership)
   - Partially exists as MembershipPlan + Price combined
   
3. **PriceQueueItem** (for dynamic pricing)
   - Doesn't exist

---

## 📋 Migration Strategy

### Phase 1A: Create New Models (Additive)

**Strategy:** Add new models WITHOUT breaking existing ones

1. **Create `Membership` model** (new)
   - Add as completely new model
   - Don't link to existing data yet
   
2. **Create enhanced `Plan` model** (new name)
   - Use `Plan` instead of `MembershipPlan`
   - Link to new `Membership`
   - Incorporate pricing directly (not separate Price table)
   
3. **Create `PriceQueueItem` model** (new)
   - For dynamic pricing queue

4. **Create enhanced `Subscription` model** (rename/enhance)
   - Could rename existing or create `PlanSubscription`
   - Link to new `Plan` instead of `MembershipPlan`

### Phase 1B: Data Migration (Careful)

**Strategy:** Migrate existing data to new models

1. Convert each `MembershipPlan` → `Membership` + `Plan`
2. Convert `Price` records → inline `Plan` fields
3. Convert `Subscription` records → enhanced `Subscription`

### Phase 1C: Deprecate Old Models (Future)

**Strategy:** Mark old models as deprecated, remove later

1. Add `// DEPRECATED` comments
2. Stop using in new code
3. Eventually remove once all data migrated

---

## 🎯 Recommended Approach

### **Option A: Side-by-Side (Safest)**

**Pros:**
- Zero risk to existing functionality
- Can test thoroughly before migration
- Easy rollback

**Cons:**
- Schema bloat (2 sets of models)
- More complex during transition

**Implementation:**
```prisma
// NEW MODELS (Phase 1)
model Membership { ... }
model Plan { ... }
model PlanSubscription { ... }
model PriceQueueItem { ... }

// OLD MODELS (Keep working)
model MembershipPlan { ... }  // DEPRECATED - use Plan
model Price { ... }           // DEPRECATED - pricing in Plan
model Subscription { ... }    // DEPRECATED - use PlanSubscription
```

---

### **Option B: In-Place Migration (Faster)**

**Pros:**
- Cleaner schema faster
- Less code duplication

**Cons:**
- Higher risk
- Need careful migration scripts
- Harder rollback

**Implementation:**
1. Add new fields to existing models
2. Rename models in place
3. Migrate data
4. Remove old fields

---

## ✅ Recommendation: **Option A (Side-by-Side)**

**Reasoning:**
- Production system with existing data
- Want zero downtime
- Can test thoroughly
- Easy to roll back if issues

**Plan:**
1. Phase 1: Add new models (side-by-side)
2. Phase 2: Create migration script
3. Phase 3: Update UI to use new models
4. Phase 4: Deprecate old models
5. Phase 5: Remove old models (later)

---

## 📊 Current vs Proposed Schema Comparison

### MembershipPlan → Membership + Plan

| Feature | Current | Proposed |
|---------|---------|----------|
| **Model Name** | `MembershipPlan` | `Membership` + `Plan` |
| **Concept** | Single model (conflated) | Two models (separated) |
| **Billing Anchor** | ❌ None | ✅ IMMEDIATE/NEXT_INTERVAL |
| **Intervals** | Via separate `Price` | ✅ On Plan directly |
| **Interval Count** | ❌ No | ✅ Yes (every 1, 2, 3 months) |
| **Multiple Plans** | ❌ No concept | ✅ allowMultiplePlans |
| **Pricing Type** | ❌ No distinction | ✅ FIXED/DYNAMIC |
| **Setup Fees** | ❌ No | ✅ Yes |
| **Product Details** | ❌ No | ✅ quantity, type |
| **Stripe** | ✅ stripeProductId | ✅ Enhanced |

---

### Subscription Enhancements

| Feature | Current | Proposed |
|---------|---------|----------|
| **Status Format** | lowercase | UPPERCASE (consistent) |
| **Period Tracking** | End only | ✅ Start + End |
| **Next Billing** | ❌ No | ✅ nextBillingDate |
| **Billing Anchor** | ❌ No | ✅ Day of month |
| **Pause Tracking** | Status only | ✅ pausedAt, resumedAt |
| **Current Price** | ❌ No | ✅ Track price |
| **Plan Link** | MembershipPlan | Plan |

---

## 🔧 Implementation Plan

### Step 1: Create New Models ✅ Next
```bash
# Add to schema.prisma:
# - Membership model
# - Plan model
# - Enhanced Subscription (as PlanSubscription)
# - PriceQueueItem model
```

### Step 2: Generate Migration
```bash
npx prisma migrate dev --name add_membership_and_plan_models
```

### Step 3: Create Seed Data
```bash
# Create example data for testing:
# - Wine Club membership
# - Monthly/Quarterly/Annual plans
# - Test subscriptions
```

### Step 4: Test Models
```bash
# Verify:
# - Models created correctly
# - Relations work
# - No conflicts with existing models
```

### Step 5: Document Changes
```bash
# Update:
# - logs/subscription-modeling-phase1.md
# - README if needed
```

---

## ⚠️ Risks & Mitigations

### Risk 1: Name Conflicts
**Problem:** `Subscription` exists, new model uses same name

**Mitigation:** 
- Use `PlanSubscription` for new model
- Keep old `Subscription` unchanged
- Migrate later

### Risk 2: Breaking Existing Code
**Problem:** Other parts of app use `MembershipPlan`

**Mitigation:**
- Don't touch existing models
- New feature uses new models only
- Parallel systems during transition

### Risk 3: Prisma Migration Failures
**Problem:** Complex schema changes fail

**Mitigation:**
- Test locally first
- Create migration, don't apply
- Review SQL before running
- Can roll back

---

## 📝 Next Actions

1. ✅ Create new models in schema.prisma
2. ⏳ Review models before generating migration
3. ⏳ Generate Prisma migration
4. ⏳ Apply migration locally
5. ⏳ Test new models with Prisma Studio
6. ⏳ Create seed data
7. ⏳ Document completion

---

**Status:** 🟢 Ready to implement  
**Estimated Time:** 1-2 hours  
**Breaking Changes:** NONE (additive only)

