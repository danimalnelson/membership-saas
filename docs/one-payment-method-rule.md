# One Payment Method Per Customer Rule

## Overview
We enforce a **strict one payment method per customer** rule across all subscriptions. When a customer updates or adds a payment method anywhere in the system, ALL their active subscriptions are automatically updated to use that payment method.

## Why This Approach?

1. **Simplicity**: Members have one payment card for all their subscriptions with a business
2. **Industry Standard**: Matches Netflix, Spotify, and most SaaS platforms
3. **Less Confusion**: Users don't need to track which card is on which subscription
4. **Better UX**: Payment management in one place (Account Information section)
5. **Easier Failed Payment Recovery**: Only one card to update if payment fails

## How It Works

### Scenario 1: User Adds Payment Method During Checkout
1. User goes to checkout for a new subscription
2. They enter a new credit card (or select existing)
3. **Webhook (`checkout.session.completed`)** triggers
4. System creates the new subscription with the selected payment method
5. **System automatically updates ALL other active subscriptions** to use the same card
6. Customer default payment method is updated in Stripe

### Scenario 2: User Updates Payment Method in Portal
1. User goes to Member Portal → "Update Payment Method"
2. They add a new card or set a different card as default
3. **API route (`/api/portal/[slug]/payment-methods/set-default`)** runs
4. System updates customer's default payment method
5. **System automatically updates ALL active subscriptions** to use the new card

### Scenario 3: Payment Method Attached (Webhook)
1. Any time a payment method is attached to a customer in Stripe
2. **Webhook (`payment_method.attached`)** triggers
3. System updates ALL active subscriptions to use the new payment method
4. Customer default payment method is updated

## Implementation Details

### Files Modified

**`apps/web/src/app/api/stripe/webhook/route.ts`**
- Added `payment_method.attached` webhook handler
- Added `syncPaymentMethodAcrossSubscriptions()` helper function
- Updated `checkout.session.completed` to sync payment methods

**`apps/web/src/app/api/portal/[slug]/payment-methods/set-default/route.ts`**
- Updates customer's default payment method
- Updates all active subscriptions to use the new default

**`apps/web/src/app/[slug]/portal/page.tsx`**
- Moved payment method display to Account Information section
- Shows single payment method for all subscriptions
- "Update Payment Method" button in Account section (not per-subscription)

### Key Functions

```typescript
// Syncs payment method from checkout across all subscriptions
async function syncPaymentMethodAcrossSubscriptions(
  session: Stripe.Checkout.Session, 
  accountId?: string
)

// Handles payment_method.attached webhook
async function handlePaymentMethodAttached(
  paymentMethod: Stripe.PaymentMethod, 
  accountId?: string
)
```

## User Experience

### Member Portal
```
Account Information
├── Email: user@example.com
├── Name: John Doe
├── Payment Method: Visa ••••4242
└── [Update Payment Method] button
```

### What Members See
- One payment method displayed in Account Information
- All subscriptions use this payment method
- Changing the payment method updates ALL subscriptions
- Clear, simple mental model: "This is my payment card"

## Testing

### Test Case 1: Add New Card During Checkout
1. Have 2 active subscriptions with Card A
2. Purchase a 3rd subscription with Card B
3. **Expected**: All 3 subscriptions now use Card B

### Test Case 2: Update Payment Method in Portal
1. Have 2 active subscriptions with Card A
2. Go to Payment Methods page
3. Add Card B and set as default
4. **Expected**: Both subscriptions now use Card B

### Test Case 3: Check Portal Display
1. Have multiple subscriptions
2. Change payment method
3. **Expected**: Account Information shows the new card
4. **Expected**: Individual subscription cards don't show payment method

## Webhooks to Enable in Stripe Dashboard

Make sure these webhook events are enabled:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `payment_method.attached` (NEW)
- ✅ `invoice.paid`

## Benefits

1. **For Users:**
   - Simple: One card for everything
   - No confusion about which card is where
   - Easy to update when card expires

2. **For Business:**
   - Fewer failed payments (only one card to manage)
   - Better customer experience
   - Industry-standard approach

3. **For Support:**
   - Easy to troubleshoot payment issues
   - Clear answer: "Your account uses one payment method for all subscriptions"

## Alternative Considered (Rejected)

We considered allowing **different payment methods per subscription**, but rejected it because:
- ❌ More complex UX
- ❌ Users would forget which card is on which subscription
- ❌ Not typical for membership/subscription businesses
- ❌ More support burden
- ❌ Doesn't match user expectations


