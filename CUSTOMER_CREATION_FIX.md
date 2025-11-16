# Customer Creation Fix Summary

## Problem

The checkout flow was creating Stripe customers prematurely:
1. **Too Early**: Customers created when user enters email (setup-intent), not on successful payment
2. **Duplicates**: Multiple customer records created for same email on repeated attempts
3. **Waste**: Abandoned checkouts left orphaned Stripe customers

## Root Cause

In `/api/checkout/[slug]/[planId]/setup-intent/route.ts`:
- Created Stripe customer immediately when SetupIntent was created
- Happened on email entry, before payment info was even provided
- No check for existing active subscriptions before creating new customer

## Solution

### 1. Defer Customer Creation (setup-intent/route.ts)

**Before:**
```typescript
// Always created customer on SetupIntent
const customer = await stripe.customers.create({
  email: consumerEmail,
  //...
});
stripeCustomerId = customer.id;
```

**After:**
```typescript
// Only reuse existing customer from previous successful subscription
if (existingConsumer?.planSubscriptions[0]?.stripeCustomerId) {
  stripeCustomerId = existingConsumer.planSubscriptions[0].stripeCustomerId;
  console.log("[Setup Intent] Reusing existing customer");
} else {
  console.log("[Setup Intent] New customer - will create on successful payment");
  // NO customer created here!
}

// SetupIntent created WITHOUT customer for new users
const setupIntent = await stripe.setupIntents.create({
  ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
  // ... rest
});
```

### 2. Create Customer on Success (confirm/route.ts)

**Added:**
```typescript
// Get or create Stripe customer
let customerId = setupIntent.customer as string | null;

// If SetupIntent doesn't have a customer (new user), create one NOW
if (!customerId) {
  const customer = await stripe.customers.create({
    email: consumerEmail,
    name: consumerName || undefined,
    payment_method: paymentMethodId,
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
    metadata: {
      businessId: business.id,
    },
  });
  customerId = customer.id;
} else {
  // Existing customer - attach payment method
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}
```

## Benefits

### ✅ No Abandoned Customers
- Customers only created after successful payment
- No orphaned records in Stripe
- Cleaner Stripe dashboard

### ✅ No Duplicates
- Checks for existing customer from previous subscriptions
- Reuses customer ID if found
- One customer per email across all subscriptions

### ✅ Better UX
- Same flow for users
- No visible changes
- More efficient behind the scenes

## Flow Comparison

### Before (Problematic)
```
1. User enters email → Create Customer ❌
2. User enters card
3. Payment fails → Orphaned customer in Stripe
4. User tries again → Creates another customer ❌
5. Payment succeeds → Yet another customer ❌
Result: 3 customers, only 1 active subscription
```

### After (Fixed)
```
1. User enters email → Check for existing customer ID
2. User enters card
3. Payment fails → No customer created ✅
4. User tries again → Still no customer ✅
5. Payment succeeds → Create customer once ✅
Result: 1 customer, 1 active subscription
```

## Testing

### Test Case 1: New User
```
1. New email: test@example.com
2. Enter payment info
3. Complete checkout
Expected: 1 Stripe customer created on success
```

### Test Case 2: Returning User
```
1. Existing email with previous subscription
2. Enter payment info for new plan
3. Complete checkout
Expected: Reuse existing Stripe customer (no duplicate)
```

### Test Case 3: Abandoned Checkout
```
1. New email: test2@example.com
2. Enter payment info
3. Close modal before completing
Expected: NO Stripe customer created
```

### Test Case 4: Failed Payment
```
1. New email: test3@example.com
2. Enter invalid card (4000 0000 0000 0002)
3. Payment fails
Expected: NO Stripe customer created
```

## Database Impact

### Before
```
Consumers: 100 records
Stripe Customers: 300 records (3x orphaned)
Active Subscriptions: 100
```

### After
```
Consumers: 100 records
Stripe Customers: 100 records (1:1 match)
Active Subscriptions: 100
```

## Files Changed

1. ✅ `apps/web/src/app/api/checkout/[slug]/[planId]/setup-intent/route.ts`
   - Removed early customer creation
   - Only reuse existing customer from previous subscriptions
   
2. ✅ `apps/web/src/app/api/checkout/[slug]/[planId]/confirm/route.ts`
   - Added customer creation on successful payment
   - Handle both new and existing customers

## Migration Notes

**No migration needed!**

- Existing customers continue to work
- New checkouts use improved flow
- No breaking changes

## Monitoring

After deployment, monitor:
- Stripe customer count should stabilize
- No increase in orphaned customers
- One customer per unique email

