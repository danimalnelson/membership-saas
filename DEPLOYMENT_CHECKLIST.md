# Deployment Checklist - Vintigo Production

**Date Started**: November 11, 2025  
**Target**: Vercel + Neon PostgreSQL  
**Status**: 🔄 In Progress

---

## ✅ Pre-Deployment Checklist

### Accounts Created
- [ ] GitHub account (repo hosting)
- [ ] Vercel account (app hosting)
- [ ] Neon account (PostgreSQL)
- [ ] Stripe account (payments)
- [ ] Resend account (emails)

### Repository
- [ ] Code committed to git
- [ ] Pushed to GitHub
- [ ] Repository accessible

---

## 📋 Step-by-Step Deployment

### Phase 1: Database Setup (Neon)

- [ ] **Step 1.1**: Go to https://neon.tech
- [ ] **Step 1.2**: Create account / Sign in
- [ ] **Step 1.3**: Create new project
  - Name: `vintigo-production`
  - Region: (Choose closest to your users)
  - PostgreSQL version: 15+
- [ ] **Step 1.4**: Copy connection string
  - Format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
- [ ] **Step 1.5**: Save to temporary `.env.production` file

**Connection String**:
```
DATABASE_URL="postgresql://..."
```

---

### Phase 2: API Keys Collection

#### Stripe (Live Mode)
- [ ] **Step 2.1**: Go to https://dashboard.stripe.com
- [ ] **Step 2.2**: Switch to "Live Mode" (toggle in top-left)
- [ ] **Step 2.3**: Go to Developers → API keys
- [ ] **Step 2.4**: Copy **Secret key** (starts with `sk_live_`)
- [ ] **Step 2.5**: Copy **Publishable key** (starts with `pk_live_`)
- [ ] **Step 2.6**: Go to Connect → Settings
- [ ] **Step 2.7**: Copy **Client ID** (starts with `ca_`)

**Stripe Keys**:
```
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_CONNECT_CLIENT_ID="ca_..."
```

**Note**: Webhook secret will be generated after Vercel deployment.

#### Resend
- [ ] **Step 2.8**: Go to https://resend.com
- [ ] **Step 2.9**: Create account / Sign in
- [ ] **Step 2.10**: Go to API Keys
- [ ] **Step 2.11**: Create new API key
  - Name: `vintigo-production`
  - Permission: Full Access
- [ ] **Step 2.12**: Copy API key (starts with `re_`)

**Resend Key**:
```
RESEND_API_KEY="re_..."
```

#### NextAuth Secret
- [ ] **Step 2.13**: Generate secret (see command below)

**Command**:
```bash
openssl rand -base64 32
```

**NextAuth Secret**:
```
NEXTAUTH_SECRET="..."
```

#### Cron Secret
- [ ] **Step 2.14**: Generate cron secret (same command, different value)

**Command**:
```bash
openssl rand -base64 32
```

**Cron Secret**:
```
CRON_SECRET="..."
```

---

### Phase 3: GitHub Repository

- [ ] **Step 3.1**: Push code to GitHub
  ```bash
  # If not already done:
  git remote add origin https://github.com/YOUR_USERNAME/vintigo.git
  git push -u origin main
  ```
- [ ] **Step 3.2**: Verify repo is accessible
- [ ] **Step 3.3**: Make repo private (recommended)

**Repository URL**: `https://github.com/YOUR_USERNAME/vintigo`

---

### Phase 4: Vercel Deployment

- [ ] **Step 4.1**: Go to https://vercel.com
- [ ] **Step 4.2**: Create account / Sign in
- [ ] **Step 4.3**: Click "Add New" → "Project"
- [ ] **Step 4.4**: Import GitHub repository
- [ ] **Step 4.5**: Configure project:
  - **Framework Preset**: Next.js
  - **Root Directory**: `apps/web`
  - **Build Command**: `pnpm build`
  - **Output Directory**: `.next`
  - **Install Command**: `pnpm install --shamefully-hoist`
  - **Node Version**: 18.x
- [ ] **Step 4.6**: **DO NOT deploy yet** - Click "Continue" but don't deploy
- [ ] **Step 4.7**: Add Environment Variables (see Phase 5)
- [ ] **Step 4.8**: Deploy

---

### Phase 5: Environment Variables (Vercel)

Go to: **Vercel Dashboard → Project Settings → Environment Variables**

Add these variables (use values from Phase 1 & 2):

#### Database
- [ ] `DATABASE_URL` = `postgresql://...` (from Neon)

#### NextAuth
- [ ] `NEXTAUTH_URL` = `https://YOUR_PROJECT.vercel.app` (temporary, will update with custom domain)
- [ ] `NEXTAUTH_SECRET` = `...` (from Step 2.13)

#### Stripe
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `STRIPE_CONNECT_CLIENT_ID` = `ca_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (will add after webhook setup)

#### Resend
- [ ] `RESEND_API_KEY` = `re_...`

#### Cron Jobs
- [ ] `CRON_SECRET` = `...` (generate with `openssl rand -base64 32`)

#### Public URLs
- [ ] `PUBLIC_APP_URL` = `https://YOUR_PROJECT.vercel.app` (temporary)
- [ ] `EMBED_PUBLIC_ORIGIN` = `https://YOUR_PROJECT.vercel.app` (temporary)

**Environment**: Select "Production" for all variables

---

### Phase 6: Database Migrations

After Vercel deployment, run migrations:

- [ ] **Step 6.1**: Install Vercel CLI
  ```bash
  npm install -g vercel
  ```
- [ ] **Step 6.2**: Login to Vercel
  ```bash
  vercel login
  ```
- [ ] **Step 6.3**: Link project
  ```bash
  cd /Users/dan/Sites/something/apps/web
  vercel link
  ```
- [ ] **Step 6.4**: Pull environment variables
  ```bash
  vercel env pull .env.local
  ```
- [ ] **Step 6.5**: Run migrations
  ```bash
  cd ../../packages/db
  pnpm db:generate
  pnpm prisma migrate deploy
  ```
- [ ] **Step 6.6**: Seed database (optional, for demo)
  ```bash
  pnpm db:seed
  ```

---

### Phase 7: Stripe Webhook Setup

- [ ] **Step 7.1**: Go to Stripe Dashboard → Developers → Webhooks
- [ ] **Step 7.2**: Click "Add endpoint"
- [ ] **Step 7.3**: Endpoint URL: `https://YOUR_PROJECT.vercel.app/api/stripe/webhook`
- [ ] **Step 7.4**: Select events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `charge.refunded`
  - `payment_method.attached`
- [ ] **Step 7.5**: Click "Add endpoint"
- [ ] **Step 7.6**: Copy **Signing secret** (starts with `whsec_`)
- [ ] **Step 7.7**: Add to Vercel env vars:
  - Go to Vercel Dashboard → Settings → Environment Variables
  - Add `STRIPE_WEBHOOK_SECRET` = `whsec_...`
  - Redeploy to apply changes

---

### Phase 8: Post-Deployment Testing

#### Health Checks
- [ ] **Step 8.1**: Visit deployment URL
- [ ] **Step 8.2**: Check homepage loads
- [ ] **Step 8.3**: Check `/api/health` (if exists)
- [ ] **Step 8.4**: Check Vercel deployment logs (no errors)

#### Business Onboarding Test
- [ ] **Step 8.5**: Sign in as business user
- [ ] **Step 8.6**: Create test business
  - Name: "Test Wine Bar"
  - Slug: "testwine"
- [ ] **Step 8.7**: Complete Stripe Connect onboarding
- [ ] **Step 8.8**: Verify `stripeAccountId` saved

#### Plan Creation Test
- [ ] **Step 8.9**: Create membership plan
  - Name: "Test Membership"
- [ ] **Step 8.10**: Add price
  - Amount: $1.00 (test with small amount)
  - Interval: month
- [ ] **Step 8.11**: Verify Stripe product created

#### Checkout Test
- [ ] **Step 8.12**: Visit `https://YOUR_PROJECT.vercel.app/testwine`
- [ ] **Step 8.13**: Click "Join Club"
- [ ] **Step 8.14**: Complete checkout with test card:
  - Card: `4242 4242 4242 4242`
  - Exp: Any future date
  - CVC: Any 3 digits
- [ ] **Step 8.15**: Verify success page
- [ ] **Step 8.16**: Check Stripe Dashboard for subscription
- [ ] **Step 8.17**: Check database for Member and Subscription records

#### Webhook Test
- [ ] **Step 8.18**: Trigger test webhook from Stripe Dashboard
- [ ] **Step 8.19**: Check Vercel logs for webhook received
- [ ] **Step 8.20**: Verify webhook delivery success in Stripe

#### Email Test
- [ ] **Step 8.21**: Check email received (welcome email)
- [ ] **Step 8.22**: Test magic link login
  - Go to `/testwine/auth/signin`
  - Enter email
  - Check email for magic link
  - Click link and verify login

#### Customer Portal Test
- [ ] **Step 8.23**: Go to `/testwine/portal`
- [ ] **Step 8.24**: Click "Open Stripe Customer Portal"
- [ ] **Step 8.25**: Verify portal opens
- [ ] **Step 8.26**: Test updating payment method
- [ ] **Step 8.27**: Test canceling subscription

---

### Phase 9: Custom Domain (Optional)

- [ ] **Step 9.1**: Go to Vercel Dashboard → Settings → Domains
- [ ] **Step 9.2**: Add domain: `vintigo.com` (or your domain)
- [ ] **Step 9.3**: Add DNS records (Vercel provides instructions)
- [ ] **Step 9.4**: Wait for SSL certificate (automatic, ~5 min)
- [ ] **Step 9.5**: Update environment variables:
  - `NEXTAUTH_URL` = `https://vintigo.com`
  - `PUBLIC_APP_URL` = `https://vintigo.com`
  - `EMBED_PUBLIC_ORIGIN` = `https://vintigo.com`
- [ ] **Step 9.6**: Update Stripe webhook URL to custom domain
- [ ] **Step 9.7**: Redeploy

---

### Phase 10: Cron Jobs & Monitoring Setup

#### Cron Jobs (Automatic Emails)
- [ ] **Step 10.1**: Verify cron jobs in Vercel Dashboard → Settings → Cron Jobs
  - `/api/cron/renewal-reminders` - Daily at 9am UTC (7-day renewal reminders)
  - `/api/cron/monthly-summaries` - 1st of month at 10am UTC (business owner reports)
- [ ] **Step 10.2**: Ensure `CRON_SECRET` is set in environment variables

#### Monitoring
- [ ] **Step 10.3**: Enable Vercel Analytics (automatic)
- [ ] **Step 10.4**: Set up Stripe email alerts
  - Go to Stripe → Settings → Notifications
  - Enable "Failed payments"
  - Enable "Webhook delivery failures"
- [ ] **Step 10.5**: Set up Neon database alerts
  - Go to Neon Dashboard → Settings
  - Enable storage alerts
  - Enable connection alerts
- [ ] **Step 10.6**: Bookmark monitoring dashboards:
  - Vercel: `https://vercel.com/dashboard`
  - Stripe: `https://dashboard.stripe.com`
  - Neon: `https://console.neon.tech`

---

## 🎉 Deployment Complete!

### Next Steps
- [ ] Onboard first real business
- [ ] Monitor for 48 hours
- [ ] Gather user feedback
- [ ] Iterate based on usage

### Support Resources
- **API Docs**: `/docs/api.md`
- **Stripe Guide**: `/docs/stripe.md`
- **Deployment Guide**: `/docs/deploy.md`
- **Mission Summary**: `MISSION_COMPLETE.md`

---

## 📊 Deployment Summary

**Start Time**: _______________  
**End Time**: _______________  
**Total Duration**: _______________

**Production URL**: _______________  
**Database**: Neon  
**Status**: 🚀 LIVE

---

## 🐛 Troubleshooting

If you encounter issues, check:
1. Vercel deployment logs
2. Stripe webhook delivery logs
3. Neon database connectivity
4. Environment variables are set correctly
5. Refer to `/docs/deploy.md` → Troubleshooting section

