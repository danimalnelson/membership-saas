# Authentication & Onboarding - Comprehensive Scenario Testing

**Branch:** `test/auth-onboarding-scenarios-2025-11-13`  
**Date:** 2025-11-13  
**Status:** 🔄 IN PROGRESS

---

## 🎯 Mission Objective

Complete end-to-end testing of all authentication and onboarding scenarios to ensure production-ready reliability.

---

## 📋 Test Scenarios

### ✅ **Completed (Previous Session)**
1. ✅ New user sign-up with email magic link
2. ✅ Business creation and details collection
3. ✅ Stripe Connect account creation
4. ✅ Onboarding completion
5. ✅ Dashboard access with proper status gates

### 🔄 **In Progress**

#### **1. Logout & Re-Login Flow**
**Status:** 🔄 Testing now  
**Steps:**
1. User is currently logged in with business created
2. Click logout from dashboard
3. Verify redirect to home/sign-in page
4. Verify session destroyed (can't access dashboard)
5. Use same email to request new magic link
6. Check email logs for magic link
7. Click magic link
8. Verify redirect to dashboard (NOT onboarding)
9. Verify existing business data still present

**Expected Outcome:**
- ✅ Clean logout with session destruction
- ✅ Magic link sent for existing user
- ✅ Direct dashboard access (skip onboarding)
- ✅ No data loss

**Issue Found:** ❌ No logout button existed in dashboard pages!

**Fix Applied:**
- Created `AppHeader` component with Sign Out button for `/app` page
- Created `DashboardHeader` component with Sign Out button for `/app/[businessId]` page
- Both use `signOut({ callbackUrl: "/" })` for proper session destruction
- Committed in: `ca7ea2a`

**Actual Outcome:** ✅ **PASSED**

**Test Results:**
1. ✅ Sign Out button visible in dashboard header
2. ✅ Logout redirects to `/auth/signin?callbackUrl=%2Fapp`
3. ✅ Session destroyed - cannot access dashboard without auth
4. ✅ Redirect to sign-in when accessing protected routes
5. ✅ Re-login magic link sent successfully to `dannelson@icloud.com`
6. ✅ "Check your email" message displayed
7. ✅ Email logs show successful send

**Conclusion:** Logout and re-authentication flow working perfectly!

---

#### **2. Partial Onboarding Resume - Details Phase**
**Status:** ⏳ Pending

**Test Scenario A: Abandon After Business Details**
1. Create new test user
2. Fill out business details form
3. Submit and create business record
4. Close browser before Stripe Connect
5. Log back in with same email
6. Expected: Resume at "Connect Stripe" step

---

#### **3. Partial Onboarding Resume - Stripe Phase**
**Status:** ⏳ Pending

**Test Scenario B: Abandon During Stripe Connect**
1. Create new test user
2. Complete business details
3. Start Stripe Connect flow
4. Close Stripe modal/tab before completion
5. Log back in
6. Expected: Show status page or "Resume Onboarding"

---

#### **4. Edge Case: Duplicate Email Sign-Up**
**Status:** ✅ **PASSED**

**Steps:**
1. ✅ Used existing user email (dannelson@icloud.com)
2. ✅ Went to sign-in page
3. ✅ Entered existing email
4. ✅ Magic link sent (not duplicate user created)
5. ✅ Clicked magic link
6. ✅ Redirected directly to existing business dashboard
7. ✅ Business data intact ("The Ruby Tap")

**Actual Outcome:**
- ✅ No duplicate user created
- ✅ Existing user recognized
- ✅ Skipped onboarding
- ✅ Direct dashboard access

**Conclusion:** Duplicate email handling working perfectly!

---

#### **5. Edge Case: Invalid Magic Link**
**Status:** ⏳ Pending

**Steps:**
1. Request magic link
2. Modify token in URL
3. Try to authenticate
4. Expected: Clear error message, prompt to request new link

---

#### **6. Full Test Suite**
**Status:** ⏳ Pending

**Command:**
```bash
bash scripts/run-full-tests.sh
```

---

## 🐛 Issues Found

[Will document any issues discovered during testing]

---

## 🔧 Fixes Applied

[Will document any fixes made]

---

## 📊 Test Results Summary

**Total Scenarios:** 6  
**Passed:** 0  
**Failed:** 0  
**In Progress:** 1  
**Pending:** 5

---

**Last Updated:** 2025-11-13 [Initial setup]

