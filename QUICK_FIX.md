# Email Not Arriving - Quick Fix

## Problem
EMAIL_FROM is set to "noreply@yourdomain.com" which is NOT verified in Resend.

## Solution Options

### Option A: Use Resend's Verified Sender (FASTEST)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find EMAIL_FROM
3. Change value to: onboarding@resend.dev
4. Click Save
5. Redeploy (Vercel will prompt)
6. Test again - emails will arrive immediately

### Option B: Remove EMAIL_FROM Variable
1. Delete the EMAIL_FROM environment variable
2. Redeploy
3. Will default to onboarding@resend.dev

### Option C: Verify Your Domain (takes longer)
1. Go to https://resend.com/domains
2. Add "yourdomain.com"
3. Add DNS records Resend provides
4. Wait for verification
5. Then emails from noreply@yourdomain.com will work

## Recommended: Option A
Change EMAIL_FROM to "onboarding@resend.dev" in Vercel and redeploy.
