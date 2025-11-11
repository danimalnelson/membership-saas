# Credential Verification Checklist

**Date:** November 11, 2025  
**Purpose:** Verify rotated Resend and Neon credentials are working

---

## Deployment Triggered

✅ Empty commit pushed to trigger fresh Vercel deployment with new credentials  
**Commit:** `e5d6add` - "Trigger Vercel deployment to verify new credentials"

---

## How to Verify

### 1. Check Vercel Deployment Status

**Go to:** https://vercel.com/dashboard  

**Look for:**
- Latest deployment status (should be "Building" or "Ready")
- Build logs should show no database connection errors
- Function logs should show no Resend API errors

**Expected:**
- ✅ Deployment succeeds
- ✅ Build completes without errors
- ✅ No "PrismaClientInitializationError" in logs
- ✅ No "Resend API authentication failed" in logs

---

### 2. Test Database Connection (Neon)

**Visit:** Your deployed app URL (e.g., https://your-app.vercel.app)

**Test these endpoints/pages:**
- [ ] **Home page** loads (basic Next.js works)
- [ ] **Sign-in page** (`/auth/signin`) loads
- [ ] **Try to sign in** with magic link
  - Should query database to check/create user
  - If it sends email without errors → Database works! ✅

**Or via API:**
```bash
# Test a database-dependent endpoint
curl https://your-app.vercel.app/api/business/test-endpoint
# Should return data or valid error (not connection error)
```

**Signs database is working:**
- No "Connection timeout" errors
- No "Authentication failed" for PostgreSQL
- Pages that query database load successfully

---

### 3. Test Email Sending (Resend)

**Test magic link auth:**
1. Go to your app's sign-in page
2. Enter your email
3. Click "Send magic link"

**Expected results:**
- ✅ "Email sent" success message
- ✅ Email arrives in inbox
- ✅ No "API key invalid" errors in Vercel logs

**Or check Vercel function logs:**
- Go to Vercel → Deployments → Latest → Functions
- Check logs for email-related functions
- Should see successful Resend API calls

---

### 4. Check Vercel Logs for Errors

**Via Dashboard:**
1. Vercel → Your Project → Deployments → Latest
2. Click on deployment
3. Check **Runtime Logs**

**Look for:**
- ❌ "PrismaClientInitializationError" = Database problem
- ❌ "401 Unauthorized" from Resend = API key problem
- ✅ Clean logs = Everything working!

**Via CLI (if you have it):**
```bash
vercel logs --follow
```

---

## Quick Verification Commands

**If you have access to the deployed app:**

```bash
# Check if database is accessible
curl -I https://your-app.vercel.app/api/business/test

# Try to trigger an email (test endpoint)
curl -X POST https://your-app.vercel.app/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

---

## Verification Checklist

**Database (Neon):**
- [ ] Vercel deployment succeeded
- [ ] No Prisma connection errors in logs
- [ ] Sign-in page loads
- [ ] Can interact with database-dependent features

**Email (Resend):**
- [ ] Magic link email sends successfully
- [ ] Email arrives in inbox
- [ ] No Resend API errors in logs

---

## If Something Doesn't Work

### Database Connection Fails:
1. Double-check `DATABASE_URL` in Vercel environment variables
2. Ensure it includes `?sslmode=require` at the end
3. Verify the new password was copied correctly (no extra spaces)
4. Check Neon console that database is active

### Email Sending Fails:
1. Double-check `RESEND_API_KEY` in Vercel environment variables
2. Verify new API key is active in Resend dashboard
3. Check Resend logs at https://resend.com/logs
4. Ensure domain is verified in Resend (if using custom domain)

---

## Current Status

**Credentials Rotated:**
- ✅ Neon Database Password
- ✅ Resend API Key

**Updated In:**
- ✅ Vercel Environment Variables (all environments)
- ⏳ Local `.env.local` (update manually if testing locally)

**Deployment:**
- ✅ Triggered (commit `e5d6add`)
- ⏳ Awaiting verification

---

**Next:** Check your Vercel dashboard for deployment status!

