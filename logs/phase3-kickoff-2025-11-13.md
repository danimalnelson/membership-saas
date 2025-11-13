# Phase 3: Business Dashboard - Kickoff

**Date:** November 13, 2025  
**Branch:** `feature/subscription-phase3-dashboard`  
**Status:** 🚀 **STARTING**

---

## 🎯 **Objective**

Build the Business Dashboard UI for managing memberships, plans, and subscriptions. This is the admin interface for businesses to create and manage their subscription offerings.

---

## 📋 **Previous Phases (COMPLETE)**

### **Phase 0: Stripe Audit** ✅
- Comprehensive audit (Score: 8.6/10)
- Identified improvements
- Created migration plan

### **Phase 1: Data Models** ✅
- 4 new models (Membership, Plan, PlanSubscription, PriceQueueItem)
- 481 lines in schema
- Seed data
- 162/162 tests passing

### **Phase 2: Stripe Integration** ✅
- Cohort billing
- Pause/resume APIs
- Webhook handlers
- Plan checkout API
- 946 lines production code

**Total So Far:** 17 commits, 3,844 lines, merged to main

---

## 🎯 **Phase 3 Goals**

### **Primary Goal**
Create business-facing UI for managing memberships and plans (no code required).

### **Core Features**

1. **Membership Management**
   - List all memberships
   - Create new membership form
   - Edit membership
   - Configure billing anchor (IMMEDIATE vs NEXT_INTERVAL)
   - Set capacity limits
   - Enable/disable features (pause, skip, gift, waitlist)
   - Add benefits
   - Manage status (DRAFT → ACTIVE → PAUSED → ARCHIVED)

2. **Plan Management**
   - List all plans (grouped by membership)
   - Create new plan form
   - Edit plan details
   - Configure pricing (FIXED vs DYNAMIC)
   - Set intervals (week/month/year + count)
   - Configure trial periods
   - Set product details (quantity, type)
   - Manage inventory (stock status, max subscribers)
   - Create Stripe Product + Price
   - Manage status

3. **Subscription Viewing**
   - List active subscriptions per plan
   - View subscriber details
   - See subscription status
   - Filter by status, plan, date
   - Export subscriber list

4. **Dashboard Overview**
   - Total memberships count
   - Total plans count
   - Active subscriptions count
   - Revenue metrics (from existing code)
   - Recent activity

---

## 🏗️ **Technical Approach**

### **UI Components Needed**

**Membership Components:**
- `MembershipList.tsx` - Grid of membership cards
- `MembershipForm.tsx` - Create/edit form
- `BillingAnchorSelector.tsx` - Radio group for IMMEDIATE/NEXT_INTERVAL
- `BenefitsList.tsx` - Dynamic list input
- `MembershipStatusBadge.tsx` - Status indicator

**Plan Components:**
- `PlanList.tsx` - Grid of plan cards (grouped by membership)
- `PlanForm.tsx` - Multi-step create/edit form
- `PricingTypeSelector.tsx` - FIXED vs DYNAMIC
- `IntervalSelector.tsx` - Dropdown for week/month/year + count input
- `TrialPeriodInput.tsx` - Trial days input
- `InventorySettings.tsx` - Stock status + max subscribers
- `PlanStatusBadge.tsx` - Status indicator

**Subscription Components:**
- `SubscriptionList.tsx` - Table with filters
- `SubscriptionDetails.tsx` - Modal/drawer with full details
- `SubscriptionStatusBadge.tsx` - Status indicator

**Dashboard Components:**
- `DashboardStats.tsx` - Metric cards
- `RecentActivity.tsx` - Activity feed
- `QuickActions.tsx` - Create membership/plan buttons

### **API Routes to Create**

1. `POST /api/memberships/create` - Create membership
2. `PUT /api/memberships/[id]` - Update membership
3. `GET /api/memberships/[id]` - Get membership details
4. `POST /api/plans/create` - Create plan (with Stripe Product/Price)
5. `PUT /api/plans/[id]` - Update plan
6. `GET /api/plans/[id]` - Get plan details
7. `GET /api/subscriptions` - List subscriptions (with filters)
8. `GET /api/subscriptions/[id]` - Get subscription details

### **Stripe Integration**

When creating a plan:
1. Create Stripe Product
2. Create Stripe Price
3. Store IDs in database
4. Link to membership

When updating a plan:
1. Update Stripe Product (name, description)
2. Create new Stripe Price if price changed
3. Update database

---

## 📊 **Phase 3 Tasks**

### **Priority 1: Foundation**
1. [ ] Create membership list page
2. [ ] Create membership create/edit form
3. [ ] Add membership API routes
4. [ ] Test membership CRUD

### **Priority 2: Plans**
5. [ ] Create plan list page (grouped by membership)
6. [ ] Create plan create/edit form (multi-step)
7. [ ] Add plan API routes (with Stripe integration)
8. [ ] Test plan CRUD + Stripe sync

### **Priority 3: Subscriptions**
9. [ ] Create subscription list page
10. [ ] Add subscription filters
11. [ ] Create subscription details view
12. [ ] Test subscription viewing

### **Priority 4: Dashboard**
13. [ ] Create dashboard overview
14. [ ] Add stats/metrics
15. [ ] Add quick actions
16. [ ] Add recent activity feed

### **Priority 5: Polish**
17. [ ] Add loading states
18. [ ] Add error handling
19. [ ] Add success notifications
20. [ ] Add form validation
21. [ ] Responsive design
22. [ ] Accessibility (a11y)

---

## 🎨 **Design Principles**

1. **Simple First:** Start with basic forms, enhance later
2. **Progressive Disclosure:** Hide advanced options in accordions
3. **Clear Feedback:** Show loading, success, error states
4. **Guided Experience:** Help text, tooltips, examples
5. **Mobile-Friendly:** Responsive from the start

---

## 🚀 **Success Criteria**

**Phase 3 is complete when:**
- ✅ Business can create memberships (no code)
- ✅ Business can create plans (no code)
- ✅ Plans sync with Stripe (Product + Price)
- ✅ Business can view all subscriptions
- ✅ Dashboard shows key metrics
- ✅ All forms have validation
- ✅ Mobile-responsive
- ✅ Tests pass
- ✅ Build succeeds
- ✅ Deployed to Vercel

---

## 📁 **File Structure**

```
apps/web/src/
├── app/
│   └── app/
│       └── [businessId]/
│           ├── dashboard/           # NEW
│           │   └── page.tsx
│           ├── memberships/         # NEW
│           │   ├── page.tsx
│           │   ├── create/
│           │   │   └── page.tsx
│           │   └── [id]/
│           │       └── edit/
│           │           └── page.tsx
│           ├── plans/
│           │   ├── page.tsx         # UPDATE (use new models)
│           │   ├── create/
│           │   │   └── page.tsx     # UPDATE (full form)
│           │   └── [id]/
│           │       └── edit/
│           │           └── page.tsx # NEW
│           └── subscriptions/       # NEW
│               ├── page.tsx
│               └── [id]/
│                   └── page.tsx
├── components/
│   ├── memberships/                 # NEW
│   │   ├── MembershipList.tsx
│   │   ├── MembershipForm.tsx
│   │   └── ...
│   ├── plans/                       # NEW
│   │   ├── PlanList.tsx
│   │   ├── PlanForm.tsx
│   │   └── ...
│   └── subscriptions/               # NEW
│       ├── SubscriptionList.tsx
│       └── ...
└── api/
    ├── memberships/                 # NEW
    │   ├── create/
    │   │   └── route.ts
    │   └── [id]/
    │       └── route.ts
    └── plans/
        ├── create/
        │   └── route.ts             # UPDATE (Stripe integration)
        └── [id]/
            └── route.ts             # NEW
```

---

## 🎯 **Immediate Next Steps**

1. Create membership list page (`/app/[businessId]/memberships/page.tsx`)
2. Create membership form component
3. Create membership API routes
4. Test end-to-end

**Let's start with Priority 1: Membership Management!**

---

**Branch:** `feature/subscription-phase3-dashboard`  
**Status:** Ready to begin  
**Estimated Time:** 6-8 hours for full Phase 3

---

**Ready to start Phase 3! 🍷**

