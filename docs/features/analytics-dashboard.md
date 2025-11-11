# Feature: Analytics Dashboard

## Overview
Display key business metrics including MRR (Monthly Recurring Revenue), active members, churn rate, and revenue trends with visual charts.

## Implementation Outline

### 1. Database Queries & Metrics Calculation
Create utility functions to calculate:
- **MRR**: Sum of all active subscription amounts (monthly equivalent)
- **Active Members**: Count of members with status="ACTIVE"
- **Churn Rate**: Canceled members in last 30 days / Total active members
- **Revenue Trend**: Monthly transaction totals over time

### 2. API Endpoint
**GET `/api/business/[businessId]/metrics`**
- Require OWNER/ADMIN role
- Return JSON with all metrics
- Cache results for 5 minutes to reduce DB load

### 3. UI Components
**Dashboard Widget at `/app/[businessId]/page.tsx`**
- Metric cards showing MRR, members, churn
- Line chart for revenue trends (last 6 months)
- Use shadcn/ui Card components
- Simple bar chart for member growth

## Files to Create
1. `packages/lib/metrics.ts` - Calculation functions
2. `apps/web/src/app/api/business/[businessId]/metrics/route.ts` - API endpoint
3. Update `apps/web/src/app/app/[businessId]/page.tsx` - Add analytics display
4. `apps/web/tests/unit/metrics.test.ts` - Unit tests for calculations

## Success Criteria
- ✅ Accurate MRR calculation from subscriptions
- ✅ Real-time member count
- ✅ Churn rate formula correct
- ✅ API caching working
- ✅ All tests passing

