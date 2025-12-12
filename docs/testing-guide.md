# Testing Guide

How to test payments, emails, and the full user experience before going live.

## Prerequisites

Make sure you have these environment variables set (in `.env.local`):

```bash
# Stripe (TEST mode keys - sk_test_*, pk_test_*)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI or Dashboard

# Resend (sends real emails)
RESEND_API_KEY=re_...

# Your local URLs
NEXTAUTH_URL=http://localhost:3000
PUBLIC_APP_URL=http://localhost:3000
```

---

## Part 1: Testing Stripe Payments

### Step 1: Create a Test Business

1. Start the dev server: `pnpm dev`
2. Go to `http://localhost:3000`
3. Sign in (creates your B2B account)
4. Complete business onboarding:
   - Business name: "Test Wine Bar"
   - Slug: "testwine"
5. Complete Stripe Connect onboarding (use test data)

### Step 2: Create a Membership & Plan

1. Go to Dashboard → Memberships → Create
2. Create a membership (e.g., "Wine Club")
3. Create a plan with a price (e.g., $10/month)
4. Set status to "Active"

### Step 3: Test Consumer Checkout

1. Open an **incognito window** (to be a "new" consumer)
2. Go to `http://localhost:3000/testwine`
3. Click on a plan → "Join"
4. Use Stripe test cards:

| Scenario | Card Number |
|----------|-------------|
| Successful payment | `4242 4242 4242 4242` |
| Payment requires authentication | `4000 0025 0000 3155` |
| Payment declined | `4000 0000 0000 0002` |
| Insufficient funds | `4000 0000 0000 9995` |

Use any future expiry date and any 3-digit CVC.

### Step 4: Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. You should see the test payment
3. Check https://dashboard.stripe.com/test/subscriptions for the subscription

---

## Part 2: Testing Emails

Emails are sent via Resend to **real email addresses**. Use your own email to test.

### Email Triggers

| Email | How to Trigger |
|-------|----------------|
| **Welcome/Confirmation** | Complete a checkout |
| **Payment Failed** | Use card `4000 0000 0000 0002` or trigger via Stripe CLI |
| **Subscription Paused** | Pause from member portal (`/testwine/portal`) |
| **Subscription Resumed** | Resume from member portal |
| **Subscription Cancelled** | Cancel from member portal |
| **Refund Processed** | Issue refund in Stripe Dashboard |

### Testing with Stripe CLI (Webhooks)

For testing webhook-triggered emails locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret (whsec_...) to your .env.local
```

Then trigger events:
```bash
# Trigger payment failed
stripe trigger invoice.payment_failed

# Trigger subscription cancelled
stripe trigger customer.subscription.deleted
```

---

## Part 3: Testing Member Portal

1. After checkout, you'll receive a magic link email
2. Or go directly to `http://localhost:3000/testwine/portal`
3. Enter your email → receive magic link → click to login
4. Test these actions:
   - View subscription details
   - Pause subscription (triggers email)
   - Resume subscription (triggers email)
   - Cancel subscription (triggers email)
   - Update payment method

---

## Part 4: Testing Business Owner Emails

Business owners receive notifications at their `contactEmail`. 

1. In your test business settings, set a contact email (your email)
2. These emails are triggered:
   - **New Member** - When someone subscribes
   - **Member Churned** - When someone cancels
   - **Payment Alert** - When a payment fails

---

## Part 5: Simulation Testing (Advanced)

For testing billing scenarios over time without waiting:

1. Go to `http://localhost:3000/admin/scenarios`
2. Create test clocks with different billing models
3. Advance time to simulate renewals

**Note:** Simulation testing uses Stripe Test Clocks on your platform account, not connected accounts. It won't trigger emails (by design - uses fake email addresses).

---

## Test Cards Quick Reference

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 3220` | 3D Secure 2 required |
| `4000 0000 0000 0341` | Attaching fails |

Full list: https://stripe.com/docs/testing#cards

---

## Checklist: Ready for Production

Before going live, verify:

- [ ] Successfully completed test checkout
- [ ] Received welcome email
- [ ] Received payment failed email (use decline card)
- [ ] Tested member portal (pause/resume/cancel)
- [ ] Business owner received new member notification
- [ ] Business owner received churn notification
- [ ] Stripe webhooks are working
- [ ] Refund email works (refund a test payment)

---

## Troubleshooting

### Emails not sending?
1. Check `RESEND_API_KEY` is set
2. Check Vercel/terminal logs for `[EMAIL]` entries
3. Test endpoint: `GET /api/test/email?to=your@email.com`

### Webhooks not working locally?
1. Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Copy the `whsec_...` secret to `.env.local`
3. Restart dev server

### Checkout failing?
1. Check browser console for errors
2. Verify Stripe Connect onboarding is complete for the business
3. Check that the plan has a valid Stripe price ID
