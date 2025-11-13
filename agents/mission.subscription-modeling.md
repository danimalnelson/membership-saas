# Mission: Subscription Product Modeling & Refinement

**Objective:** Expand and refine the membership and plan data model to support flexible, real-world subscription businesses (wine clubs, beer clubs, artisan goods, etc.)

**Canonical Example:** Wine Club Subscription Service  
**Current Status:** Basic `Plan` model exists in Prisma schema  
**Target:** Production-ready membership + plan system with Stripe integration

---

## 🎯 Mission Overview

Design and implement a comprehensive subscription product system that supports:
1. **Memberships** (collections of plans with business rules)
2. **Plans** (individual subscription offerings)
3. **Flexible pricing** (fixed vs. dynamic)
4. **Stripe integration** (leverage Stripe Subscriptions + Products)
5. **Real-world scenarios** (wine clubs, beer clubs, CSAs, etc.)

---

## 📋 Current Understanding

### Memberships
A **Membership** is a collection of related plans with shared rules:
- **Attributes:**
  - Name (e.g., "Wine Club", "Premium Tier", "Seasonal Selection")
  - Description (marketing copy, benefits)
  - Plans (one or many subscription options)
  - Exclusivity rule: "one plan only" vs "multiple plans allowed"

- **Example:**
  - **Wine Club Membership**
    - Can only subscribe to ONE of: Red Wine Plan, White Wine Plan, Mixed Plan
  - **Beer Club Membership**
    - Can subscribe to ANY of: IPA Plan, Lager Plan, Seasonal Plan

### Plans
A **Plan** is an individual subscription offering:
- **Core Attributes:**
  - Name (e.g., "Monthly Red Wine Selection")
  - Description (what's included, benefits)
  - Image (product photo)
  - Membership association (belongs to one membership)

- **Pricing Attributes:**
  - **Fixed Price:** Set once, charged automatically (e.g., $50/month forever)
  - **Dynamic Price:** Varies per interval (e.g., $45 one month, $60 next month)
  - Interval: weeks, months, years
  - Interval count: 1, 2, 3, etc. (e.g., every 2 months)

- **Open Questions:**
  - How to handle dynamic pricing? Manual input? Email reminders?
  - How to communicate price changes to customers?
  - Trial periods? Setup fees? Discounts?

---

## 🍷 Real-World Subscription Attributes

### Missing Attributes (Canonical Wine/Beer Club)

#### **Membership-Level Attributes**
1. **Display Order** - Sort order on public page
2. **Active/Inactive Status** - Hide without deleting
3. **Members-Only Flag** - Require existing membership to join
4. **Gift Options** - Can this be purchased as a gift?
5. **Waitlist Enabled** - Allow waitlist when sold out
6. **Max Members** - Capacity limit (e.g., limited production)
7. **Join Window** - Specific enrollment periods (e.g., twice a year)
8. **Auto-Renew Default** - Default renewal setting
9. **Cancellation Policy** - Immediate, end of term, notice period
10. **Member Benefits** - Perks, discounts, events, exclusive access

#### **Plan-Level Attributes**

**Product Details:**
1. **Quantity per Shipment** - How many items (e.g., 3 bottles, 6 bottles)
2. **Product Type** - Wine, beer, spirits, food, mixed
3. **Customization Options** - Red/white preference, dietary restrictions
4. **Substitution Policy** - What if item unavailable?

**Pricing & Billing:**
5. **Setup/Joining Fee** - One-time charge (common in wine clubs)
6. **Shipping Cost** - Included, flat rate, calculated, free over X
7. **Tax Handling** - Included or added at checkout
8. **Price Tiers** - Quantity-based pricing (3 bottles vs 6 bottles)
9. **Dynamic Pricing Notification** - How many days before charge?
10. **Price Lock Period** - Guarantee price for X months

**Scheduling & Fulfillment:**
11. **Start Date** - When does first shipment go out?
12. **Billing Anchor** - Charge on same day each period or anniversary?
13. **Fulfillment Lead Time** - Days between charge and shipment
14. **Pause/Skip Options** - Can members pause or skip shipments?
15. **Max Skips** - Limit on consecutive skips
16. **Seasonal Availability** - Only available certain months

**Inventory & Capacity:**
17. **Stock Status** - Available, sold out, coming soon
18. **Inventory Tracking** - Tie to physical inventory
19. **Pre-order vs In-Stock** - Future vs immediate
20. **Allocation Method** - First-come, lottery, waitlist

**Trial & Commitment:**
21. **Trial Period** - Free trial or discounted first shipment
22. **Minimum Commitment** - Must stay for X months
23. **Early Cancellation Fee** - Penalty for canceling early
24. **Prepay Discount** - Pay 12 months upfront for discount

**Member Experience:**
25. **Renewal Reminder** - Email X days before renewal
26. **Shipment Tracking** - Automatic tracking info
27. **Feedback Collection** - Rate each shipment
28. **Member Portal Features** - Update preferences, pause, upgrade

**Marketing & Conversion:**
29. **Badge/Label** - "Best Seller", "New", "Limited", "Award Winner"
30. **Promotional Pricing** - Temporary discount
31. **Referral Bonus** - Credit for referring friends
32. **Upgrade/Downgrade Path** - Easy plan switching

---

## 🎯 Dynamic Pricing Solutions

The challenge: Dynamic pricing requires business input each interval.

### Option 1: Manual Price Updates (Simple)
- **Flow:**
  1. 7 days before billing cycle, email business owner
  2. Business logs in, sets next period's price
  3. System updates Stripe, notifies customers if price changed
  4. Charge happens on schedule

- **Pros:** Simple, flexible, no automation needed
- **Cons:** Manual work, can forget, blocks billing if not done

### Option 2: Price Queue (Moderate)
- **Flow:**
  1. Business pre-sets prices for next N periods
  2. System automatically uses queued prices
  3. Warning email when queue running low (< 2 periods)
  4. Falls back to last price if queue empty

- **Pros:** Less manual work, predictable
- **Cons:** Requires planning, complex UI

### Option 3: Dynamic Formula (Advanced)
- **Flow:**
  1. Business sets pricing rules (e.g., "cost + 30% markup")
  2. Business updates cost in system when received
  3. System auto-calculates price based on formula
  4. Notifies customers of price, charges automatically

- **Pros:** Minimal manual work, scales well
- **Cons:** Complex to build, may not fit all businesses

### Option 4: Approval Workflow (Hybrid)
- **Flow:**
  1. System suggests price based on history/formula
  2. Business reviews and approves (or edits) via email link
  3. If not approved in X days, uses suggested price
  4. Customer notified, charge happens

- **Pros:** Balance of automation and control
- **Cons:** Can be confusing, requires clear UX

### **Recommendation:**
Start with **Option 1 (Manual)** for MVP, add **Option 2 (Queue)** for v2.

### **Decisions Made:**

#### **Pricing Decisions:**
- **Dynamic Pricing:** Start with Manual (Option 1), add Queue (Option 2) in V2
  - Email reminders: 7 days before + 1 day before billing
  - If not set: Block billing (don't charge incorrect amount)
- **Fixed Pricing:** When price changes, give business option to notify active subscribers

#### **Billing Architecture:**
- **Billing Anchor:** Set at MEMBERSHIP level (IMMEDIATE vs NEXT_INTERVAL)
  - IMMEDIATE: Start immediately, bill on member's anniversary date
  - NEXT_INTERVAL: Start at next cohort date (e.g., 1st of month), bill with cohort
  - Same-day signup rule: If signup on billing day, start NEXT interval (e.g., Feb 1 signup → March 1 start)
- **Intervals:** Set at PLAN level (each plan can have different frequency)
  - Enables monthly, quarterly, annual plans in same membership
  - Example: Monthly ($40), Quarterly ($110), Annual ($400)

#### **Member Experience:**
- **Multiple Subscriptions:** Member can subscribe to multiple plans in one membership (if allowed)
- **Proration:** None - members wait for next interval start (no partial period charges)
- **Plan Changes:** Can happen anytime, takes effect at next billing interval
- **Pausing:** Subscription status becomes PAUSED, billing stops
  - On resume: Billing date resets to resume date (not original date)
- **Status Tracking:** On Subscription model (not Membership)

#### **Scope Decisions:**
- **Currency:** USD only for MVP
- **Inventory:** No physical inventory tracking
- **Fulfillment:** No shipping/delivery time tracking
- **Plan-Membership:** Each plan belongs to ONE membership only (1:many relationship)

---

## 🗄️ Data Model Considerations

### Stripe Integration
- **Stripe Product** = Business + Membership + Plan combination
- **Stripe Price** = Fixed or dynamic pricing for a plan
- **Stripe Subscription** = Customer subscribing to a plan
- **Considerations:**
  - How to handle price changes in Stripe?
  - Archive old prices vs update in place?
  - Multi-currency support?

### Database Schema Needs

**Membership Table:**
```prisma
model Membership {
  id                String   @id @default(cuid())
  businessId        String
  business          Business @relation(...)
  
  // Core
  name              String
  description       String?
  slug              String   @unique
  
  // Rules
  allowMultiplePlans Boolean @default(false)  // Can member subscribe to multiple plans?
  maxMembers        Int?                      // Capacity limit
  
  // Billing Settings (MEMBERSHIP LEVEL)
  billingAnchor     BillingAnchor @default(IMMEDIATE)
  cohortBillingDay  Int?          // 1-31, required if NEXT_INTERVAL
  
  // Status
  status            MembershipStatus @default(ACTIVE)
  displayOrder      Int      @default(0)
  
  // Features
  giftEnabled       Boolean  @default(true)
  waitlistEnabled   Boolean  @default(false)
  membersOnlyAccess Boolean  @default(false)
  
  // Member Experience
  pauseEnabled      Boolean  @default(false)  // Can members pause?
  skipEnabled       Boolean  @default(false)  // Can members skip?
  
  // Metadata
  benefits          Json?    // Array of benefit strings
  images            Json?    // Array of image URLs
  
  plans             Plan[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([businessId, status])
}

enum BillingAnchor {
  IMMEDIATE       // Start immediately, bill on anniversary
  NEXT_INTERVAL   // Start at next cohort date, bill with cohort
}

enum MembershipStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}
```

**Enhanced Plan Table:**
```prisma
model Plan {
  id                String      @id @default(cuid())
  businessId        String
  business          Business    @relation(...)
  membershipId      String      // Required - each plan belongs to ONE membership
  membership        Membership  @relation(...)
  
  // Core
  name              String
  description       String?
  images            Json?       // Array of image URLs
  
  // Pricing
  pricingType       PricingType @default(FIXED)
  basePrice         Int?        // In cents (for fixed pricing)
  currency          String      @default("usd")
  
  // Subscription Details (PLAN LEVEL - each plan sets its own frequency)
  interval          PriceInterval  // week, month, year
  intervalCount     Int         @default(1)  // every 1, 2, 3, etc.
  
  // Examples:
  // Monthly: interval=MONTH, intervalCount=1
  // Quarterly: interval=MONTH, intervalCount=3
  // Bi-weekly: interval=WEEK, intervalCount=2
  // Annual: interval=YEAR, intervalCount=1
  
  // Product Details
  quantityPerShipment Int?
  productType       String?     // "wine", "beer", etc.
  
  // Fees & Shipping
  setupFee          Int?        // In cents
  shippingType      ShippingType @default(INCLUDED)
  shippingCost      Int?        // In cents
  
  // Trial & Commitment
  trialPeriodDays   Int?
  minimumCommitmentMonths Int?
  
  // Inventory
  stockStatus       StockStatus @default(AVAILABLE)
  maxSubscribers    Int?
  
  // Status
  status            PlanStatus  @default(DRAFT)
  displayOrder      Int         @default(0)
  
  // Stripe
  stripeProductId   String?     @unique
  stripePriceId     String?     // Current active price
  
  // Dynamic Pricing
  priceQueue        PriceQueueItem[]
  
  subscriptions     Subscription[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([membershipId, status])
  @@index([businessId, status])
}

enum PricingType {
  FIXED
  DYNAMIC
}

enum ShippingType {
  INCLUDED
  FLAT_RATE
  CALCULATED
  FREE_OVER_AMOUNT
}

// NOTE: BillingAnchor moved to Membership model (see above)

enum StockStatus {
  AVAILABLE
  SOLD_OUT
  COMING_SOON
  WAITLIST
}

enum PlanStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}
```

**Subscription Table (member's subscription to a plan):**
```prisma
model Subscription {
  id                  String   @id @default(cuid())
  planId              String
  plan                Plan     @relation(...)
  userId              String   // The member/customer
  user                User     @relation(...)
  
  // Status (DECISION: Status tracked here, not on Membership)
  status              SubscriptionStatus @default(ACTIVE)
  
  // Billing dates
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  billingCycleAnchor  Int?     // Day of month (1-31) for IMMEDIATE billing
  nextBillingDate     DateTime
  
  // Pause/Resume tracking (DECISION: Resume resets billing date)
  pausedAt            DateTime?
  resumedAt           DateTime?
  canceledAt          DateTime?
  
  // Stripe
  stripeSubscriptionId String? @unique
  stripeCustomerId     String?
  
  // Pricing
  currentPrice        Int      // In cents
  currency            String   @default("usd")
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([userId, status])
  @@index([planId, status])
  @@index([nextBillingDate])
}

enum SubscriptionStatus {
  ACTIVE          // Currently active and billing
  PAUSED          // Member paused (no billing)
  CANCELED        // Canceled by member
  PAST_DUE        // Payment failed
  INCOMPLETE      // Stripe failed to create subscription
  EXPIRED         // Ended naturally (if not auto-renew)
}
```

**Price Queue (for dynamic pricing):**
```prisma
model PriceQueueItem {
  id           String   @id @default(cuid())
  planId       String
  plan         Plan     @relation(...)
  
  effectiveAt  DateTime // When this price takes effect
  price        Int      // In cents
  
  // Notification tracking (DECISION: Email 7 days + 1 day before)
  notifiedAt7Days  DateTime?
  notifiedAt1Day   DateTime?
  applied          Boolean  @default(false)
  
  stripePriceId String? // Created price in Stripe
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([planId, effectiveAt])
}
```

---

## 🔧 Technical Implementation Tasks

### Phase 1: Data Model
1. ✅ Review current Plan schema
2. [ ] Design Membership model
3. [ ] Design enhanced Plan model
4. [ ] Design PriceQueueItem model
5. [ ] Create Prisma migration
6. [ ] Seed test data

### Phase 2: Stripe Integration
1. [ ] Create Stripe Products for plans
2. [ ] Create Stripe Prices (fixed vs dynamic)
3. [ ] Handle price updates
4. [ ] Webhook for subscription events
5. [ ] Handle plan changes/upgrades

### Phase 3: Business UI
1. [ ] Membership creation form
2. [ ] Plan creation form (enhanced)
3. [ ] Dynamic pricing management
4. [ ] Price queue interface
5. [ ] Member management dashboard

### Phase 4: Consumer UI
1. [ ] Public membership browse page
2. [ ] Plan selection and comparison
3. [ ] Checkout flow (handle memberships)
4. [ ] Member portal (pause, skip, upgrade)
5. [ ] Subscription management

### Phase 5: Automation
1. [ ] Email reminders for dynamic pricing
2. [ ] Renewal notifications
3. [ ] Shipment tracking integration
4. [ ] Inventory sync
5. [ ] Analytics and reporting

---

## ✅ Product Decisions - FINALIZED

### Core Architecture
1. ✅ **Billing Anchor:** Set at MEMBERSHIP level (IMMEDIATE vs NEXT_INTERVAL)
2. ✅ **Intervals:** Set at PLAN level (monthly, quarterly, annual in same membership)
3. ✅ **Plan-Membership:** Each plan belongs to ONE membership (1:many)
4. ✅ **Multiple Subscriptions:** Members can subscribe to multiple plans if membership allows
5. ✅ **Currency:** USD only for MVP
6. ✅ **Inventory Tracking:** Not needed

### Billing & Pricing
7. ✅ **Dynamic Pricing:** Manual input (MVP) → Queue system (V2)
8. ✅ **Dynamic Pricing Fallback:** Block billing + email reminders (7 days + 1 day before)
9. ✅ **Fixed Price Changes:** Business can optionally notify subscribers
10. ✅ **Proration:** None - members wait for next interval
11. ✅ **Same-Day Signup:** If signup on billing day, start NEXT interval (Feb 1 → March 1)

### Member Experience
12. ✅ **Plan Changes:** Can happen anytime, takes effect at next billing interval
13. ✅ **Pausing:** Status = PAUSED, billing stops
14. ✅ **Resume:** Billing date resets to resume date (not original)
15. ✅ **Status Tracking:** On Subscription model (not Membership)
16. ✅ **Fulfillment:** No shipping/delivery time tracking needed

### Remaining Questions (Low Priority)
1. Can a membership have zero plans (draft/placeholder state)?
2. How to handle changing allowMultiplePlans with active subscribers?
3. Can customers lock in a price for X months?
4. Multi-user access (owner + staff)?
5. Role-based permissions (who can set prices)?
6. Reporting requirements (MRR, churn, LTV)?

---

## 🎯 Success Criteria

### MVP (Minimum Viable Product)
- [ ] **Membership Model:**
  - Create memberships with billing anchor (IMMEDIATE vs NEXT_INTERVAL)
  - Set allowMultiplePlans (one vs many plans)
  - Configure cohortBillingDay for NEXT_INTERVAL
  - Enable/disable pause and skip features
- [ ] **Plan Model:**
  - Create plans with intervals (weekly, monthly, quarterly, annual)
  - Fixed pricing fully working
  - Dynamic pricing with manual updates (email reminders 7d + 1d)
  - Support for setup fees, shipping costs
- [ ] **Subscription Flow:**
  - NEXT_INTERVAL: Calculate correct start date (not same day as billing day)
  - IMMEDIATE: Start immediately, bill on anniversary
  - Stripe subscription integration
  - Multiple plan subscriptions (if membership allows)
- [ ] **Member Portal:**
  - View active subscriptions
  - Pause/resume (resets billing date)
  - Change plans (takes effect next interval)
  - Cancel subscription

### V1 (Version 1)
- [ ] Price queue for dynamic pricing
- [ ] Automated email reminders
- [ ] Pause/skip functionality
- [ ] Plan upgrades/downgrades
- [ ] Gift subscriptions
- [ ] Inventory tracking
- [ ] Analytics dashboard

### V2 (Future)
- [ ] Dynamic pricing formulas
- [ ] Multi-currency support
- [ ] Advanced analytics
- [ ] Fulfillment integrations
- [ ] Mobile app
- [ ] API for third-party integrations

---

## 📚 Reference Examples

### Wine Club Models
- **Napa Wine Club:** Fixed price, quarterly, 4-12 bottles, red/white/mixed
- **Wine.com Club:** Tiered pricing, monthly/quarterly, customizable
- **Firstleaf:** Dynamic pricing based on preferences, monthly

### Beer Club Models
- **Craft Beer Club:** Fixed price, monthly, 12 beers, style preferences
- **Beer of the Month Club:** Multiple tiers, monthly, 2-12 beers

### Common Patterns
- **Quantity Tiers:** 3, 6, or 12 bottles per shipment
- **Frequency:** Monthly, bi-monthly, quarterly, annually
- **Selection:** Red, white, mixed, or custom preferences
- **Member Perks:** Discounts, events, exclusive access, free shipping

---

## 🚀 Execution Protocol

### Agent Instructions
1. **Start with Audit:**
   - Review current `Plan` model in `packages/db/prisma/schema.prisma`
   - Document what exists vs what's needed
   - Identify breaking changes vs additive changes

2. **Design Phase:**
   - Create detailed schema for `Membership`, enhanced `Plan`, `PriceQueueItem`
   - Map to Stripe's data model (Product, Price, Subscription)
   - Consider edge cases and constraints

3. **Implementation Phase:**
   - Create Prisma migrations (additive first, breaking later)
   - Build API routes for CRUD operations
   - Create UI components (forms, dashboards)
   - Integrate with Stripe API

4. **Testing Phase:**
   - Unit tests for business logic
   - Integration tests for Stripe
   - E2E tests for user flows
   - Test edge cases (price changes, upgrades, etc.)

5. **Documentation Phase:**
   - API documentation
   - User guides for businesses
   - Migration guide for existing plans
   - Pricing model explainer

### Branching Strategy
```bash
feature/subscription-modeling-phase1-data-model
feature/subscription-modeling-phase2-stripe
feature/subscription-modeling-phase3-business-ui
feature/subscription-modeling-phase4-consumer-ui
feature/subscription-modeling-phase5-automation
```

### Commit Standards
- `feat(subscriptions): add Membership model`
- `feat(subscriptions): add dynamic pricing queue`
- `feat(ui): add membership creation form`
- `fix(subscriptions): handle price change edge case`
- `test(subscriptions): add membership exclusivity tests`

---

## 📋 Next Steps

**Immediate:**
1. Agent audits current Plan model
2. Proposes Membership + enhanced Plan schema
3. Gets approval before implementing
4. Creates migration plan (backward compatible)

**Then:**
5. Implements data model
6. Adds Stripe integration
7. Builds business UI
8. Builds consumer UI
9. Adds automation

---

> **This mission will transform a basic Plan model into a production-ready subscription platform that supports real-world wine clubs, beer clubs, and other subscription businesses with flexible pricing, inventory management, and excellent member experience.**

