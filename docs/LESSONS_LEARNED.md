# Lessons Learned: Production Auth Outage (Nov 13, 2025)

## 📋 Incident Summary

**Duration:** ~3 hours  
**Impact:** Complete auth failure - users couldn't sign in  
**Root Cause:** Multiple compounding issues with environment variables and deployment process

---

## 🔍 What Went Wrong

### 1. **Missing Environment Variables**
- `STRIPE_SECRET_KEY` was not set in Vercel
- Stripe SDK initialized at module load time: `new Stripe(process.env.STRIPE_SECRET_KEY)`
- Missing key caused silent hang, blocking ALL API routes (not just Stripe-related ones)

### 2. **Removed Critical Config**
- `NEXTAUTH_URL` was removed thinking it was optional
- NextAuth needed explicit URL for magic link generation
- Without it, auth emails contained incorrect callback URLs

### 3. **Environment Variable Drift**
- Local `.env.local` had different values than Vercel production
- Database password was rotated in Vercel but not locally
- `RESEND_API_KEY` was reported incorrectly during troubleshooting

### 4. **Module-Level Initialization**
Module-level code runs BEFORE route handlers:
```typescript
// ❌ This blocks ALL routes if STRIPE_SECRET_KEY is missing
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

Even routes that don't use Stripe were blocked because Next.js loads all modules during initialization.

### 5. **No Post-Deployment Verification**
- Deployed without testing basic functionality
- No automated health checks
- No smoke tests to catch issues immediately

### 6. **Too Many Changes at Once**
- Phase 4 added Upstash, portal routes, and other features in one merge
- When it broke, couldn't isolate the root cause quickly
- Suspected Upstash (removed it), but that wasn't the actual issue

---

## ✅ Solutions Implemented

### 1. **Health Check Endpoint** (`/api/health`)
- Tests all critical services (Database, Stripe, Email, NextAuth)
- Returns 200 if healthy, 503 if degraded
- Shows which specific service is failing
- Can be monitored by uptime services (UptimeRobot, Better Uptime, etc.)

### 2. **Environment Variable Validation** (`env-validator.ts`)
- Runs at module load time in development
- Checks for missing required vars
- Validates format (DATABASE_URL must start with `postgresql://`, etc.)
- Warns about optional but recommended vars

### 3. **Automated Smoke Tests** (`scripts/smoke-test.sh`)
- Tests health endpoint
- Tests sign-in page loads
- Tests API routes respond
- Tests static assets load
- Run after every deployment: `bash scripts/smoke-test.sh [URL]`

### 4. **GitHub Actions** (`.github/workflows/deployment-check.yml`)
- Automatically runs smoke tests after Vercel deployment
- Fails the workflow if health checks fail
- Provides early warning of deployment issues

### 5. **Updated Deployment Protocol**
Added to `dev-assistant.md`:
- Always run smoke tests after deployment
- Verify `/api/health` returns 200
- Test sign-in flow manually
- Check environment variables match expected values

---

## 🎯 Prevention Checklist

### **Before Every Deployment:**
- [ ] Run full test suite: `bash scripts/run-full-tests.sh`
- [ ] Build locally: `cd apps/web && pnpm build`
- [ ] Verify environment variables in Vercel match `.env.example`
- [ ] Review what changed since last working deployment

### **After Every Deployment:**
- [ ] Wait for Vercel build to complete
- [ ] Run smoke tests: `bash scripts/smoke-test.sh [DEPLOYMENT_URL]`
- [ ] Check health endpoint: `[DEPLOYMENT_URL]/api/health`
- [ ] Test sign-in flow manually
- [ ] Monitor for errors in Vercel logs

### **When Adding New Features:**
- [ ] Add new env vars to `.env.example` with documentation
- [ ] Update `env-validator.ts` if new env vars are required
- [ ] Add health checks for new external services
- [ ] Update smoke tests if new critical paths are added
- [ ] Make small, incremental changes (not large feature merges)

---

## 📊 Monitoring & Alerting

### **Recommended Setup:**

1. **Uptime Monitoring** (UptimeRobot, Better Uptime, Pingdom)
   - Monitor: `https://your-domain.com/api/health`
   - Alert if: Status code != 200
   - Check interval: Every 5 minutes

2. **Vercel Integration**
   - Enable email notifications for failed deployments
   - Review build logs for warnings

3. **Sentry / Error Tracking** (optional)
   - Catch runtime errors in production
   - Alert on new error types

---

## 🧪 Testing Strategy

### **What We Should Have Had:**

1. **Integration Tests for Auth**
```typescript
test('can send magic link email', async () => {
  const response = await POST('/api/auth/signin/email', {
    email: 'test@example.com'
  });
  expect(response.status).toBe(200);
  // Verify email was sent (mock Resend)
});
```

2. **Health Check Tests**
```typescript
test('health endpoint validates all services', async () => {
  const response = await GET('/api/health');
  expect(response.status).toBe(200);
  expect(response.body.checks.database).toBe(true);
  expect(response.body.checks.stripe).toBe(true);
});
```

3. **E2E Test for Sign-In Flow**
```typescript
test('user can sign in with magic link', async () => {
  // Enter email
  // Intercept email
  // Click magic link
  // Assert: user is signed in
});
```

---

## 🔮 Future Improvements

### **Phase 1: Essential (Do Now)**
- [x] Add `/api/health` endpoint
- [x] Create smoke test script
- [x] Add env var validation
- [x] Update deployment protocol
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Document all env vars in `.env.example`

### **Phase 2: Important (Next Sprint)**
- [ ] Add integration tests for auth flow
- [ ] Add E2E test for sign-in
- [ ] Set up Sentry for error tracking
- [ ] Create runbook for common issues

### **Phase 3: Nice to Have (Future)**
- [ ] Automated rollback on failed health checks
- [ ] Canary deployments (test with 5% traffic first)
- [ ] Synthetic monitoring (simulate user journeys)

---

## 💡 Key Takeaways

1. **Environment variables are critical infrastructure** - treat them like code
2. **Module-level initialization can be dangerous** - lazy-load when possible
3. **Deploy small, incremental changes** - easier to debug when things break
4. **Always verify deployments** - automated tests + manual checks
5. **Keep local and production environments in sync** - document what's where

---

## 📚 Related Documentation

- [Vercel Deployment Guide](./vercel-deployment.md)
- [Environment Variables](../ENV_VARIABLES_FOR_VERCEL.txt)
- [Architecture Overview](./architecture.md)
- [Secret Prevention Guide](./SECRET_PREVENTION.md)

