# Vercel Deployment Guide

**Updated:** November 13, 2025  
**Project:** Vintigo (Wine Club SaaS)

---

## 🚀 **Automatic Deployments**

Vercel automatically deploys every push to GitHub:

| Branch Type | Deployment Type | URL Pattern | Notes |
|-------------|----------------|-------------|-------|
| `main` | **Production** | `vintigo.vercel.app` | Automatic on merge |
| Feature branches | **Preview** | `vintigo-git-[branch]-[team].vercel.app` | Automatic on push |
| Pull Requests | **Preview** | Linked in PR checks | Automatic on PR |

---

## ✅ **Verification Process**

### **For Feature Branches** (Recommended)

1. **Push branch to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Check deployment status:**
   - **Option A:** Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - **Option B:** Check GitHub PR (if created) for deployment check
   - **Option C:** Wait for Vercel bot comment with preview URL

3. **Verify build success:**
   - ✅ Build completes without errors
   - ✅ Preview URL loads correctly
   - ✅ Key functionality works

4. **If build fails:**
   - Check Vercel build logs
   - Fix errors locally
   - Push fix
   - Vercel redeploys automatically

---

## 🔧 **Common Build Issues**

### **1. Prisma Schema Errors**

**Error:**
```
Error parsing attribute "@default": The defined default value `DRAFT` 
is not a valid value of the enum specified for the field.
```

**Cause:** Enum value doesn't exist in schema

**Fix:**
```prisma
enum PlanStatus {
  DRAFT     // Add missing value
  ACTIVE
  ARCHIVED
}
```

---

### **2. Environment Variables Missing**

**Error:**
```
Error: Environment variable not found: DATABASE_URL
```

**Cause:** Environment variable not configured in Vercel

**Fix:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add missing variable
3. Trigger redeploy (push commit or click "Redeploy" in Vercel)

**Required Environment Variables:**
- `DATABASE_URL` (required for Prisma)
- `NEXTAUTH_URL` (required for auth)
- `NEXTAUTH_SECRET` (required for auth)
- `STRIPE_SECRET_KEY` (required for Stripe)
- `STRIPE_WEBHOOK_SECRET` (required for webhooks)
- `RESEND_API_KEY` (required for emails)
- `EMAIL_FROM` (required for emails)
- (See `ENV_VARIABLES_FOR_VERCEL.txt` for complete list)

---

### **3. Dependency Installation Failures**

**Error:**
```
ELIFECYCLE  Command failed with exit code 1
```

**Cause:** Dependencies can't install or postinstall scripts fail

**Fix:**
1. Check if `pnpm-lock.yaml` is committed
2. Verify all dependencies are in `package.json`
3. Check postinstall scripts (Prisma generate, etc.)
4. Ensure Prisma schema is valid

---

### **4. TypeScript Errors**

**Error:**
```
Type error: ...
```

**Cause:** Type errors in code

**Fix:**
1. Run `pnpm typecheck` locally
2. Fix all type errors
3. Commit and push

---

## 📋 **Pre-Deployment Checklist**

Before pushing to any branch:

- [ ] Run `bash scripts/run-full-tests.sh` locally
- [ ] All tests pass (unit, integration)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented

After pushing:

- [ ] Vercel preview deployment succeeds
- [ ] Preview URL loads without errors
- [ ] Key functionality verified
- [ ] Vercel build logs clean

---

## 🎯 **Deployment Workflow**

### **Development (Feature Branch)**

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes, commit along the way
git add .
git commit -m "feat: add new feature"

# 3. Run tests
bash scripts/run-full-tests.sh

# 4. Push to GitHub
git push origin feature/my-feature

# 5. Verify Vercel preview deployment
# Check Vercel dashboard or GitHub PR

# 6. If deployment succeeds, create PR
# If fails, fix issues and push again
```

### **Production (Main Branch)**

```bash
# 1. Merge PR to main (after review + tests)
# 2. Vercel automatically deploys to production
# 3. Verify production deployment
# 4. Monitor for errors
```

---

## 🔍 **Monitoring Deployments**

### **Vercel Dashboard**

Visit: https://vercel.com/dashboard

**What to check:**
- Build status (✅ or ❌)
- Build duration
- Preview URL
- Build logs

### **GitHub PR Checks**

**Vercel bot adds:**
- Deployment status check
- Preview URL comment
- Build logs link

### **Build Logs**

**Location:** Vercel Dashboard → Deployment → Build Logs

**What to look for:**
- `✓ Compiled successfully` (good)
- `Error:` or `Failed` (bad)
- Dependency warnings
- Prisma generation success

---

## 🚨 **Troubleshooting**

### **Deployment stuck on old commit**

**Issue:** Vercel deploying older commit

**Causes:**
1. GitHub push didn't complete
2. Vercel webhook missed
3. Deployment queue backed up

**Fix:**
```bash
# Option 1: Force push (if safe)
git push origin feature/your-branch --force-with-lease

# Option 2: Empty commit to trigger redeploy
git commit --allow-empty -m "chore: trigger redeploy"
git push origin feature/your-branch

# Option 3: Manual redeploy in Vercel dashboard
# Click "Redeploy" button on latest deployment
```

---

### **"Ignored build scripts" warning**

**Warning:**
```
Ignored build scripts: @prisma/client, @prisma/engines, esbuild, prisma, sharp
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

**Impact:** Usually harmless - Vercel runs postinstall scripts anyway

**Fix (if needed):**
```bash
# In project root
pnpm approve-builds
git add .
git commit -m "chore: approve build scripts"
git push
```

---

### **Prisma Client not generated**

**Error:**
```
Cannot find module '@prisma/client'
```

**Cause:** Prisma Client generation failed

**Fix:**
1. Verify `packages/db/package.json` has postinstall script:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
2. Verify Prisma schema is valid
3. Check Vercel build logs for Prisma errors

---

## 📚 **Resources**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Prisma + Vercel:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Next.js + Vercel:** https://nextjs.org/docs/deployment

---

## 🎓 **Best Practices**

1. ✅ **Always verify preview deployments** before merging to main
2. ✅ **Test locally first** with full test suite
3. ✅ **Use feature branches** for all changes
4. ✅ **Monitor Vercel dashboard** for build status
5. ✅ **Fix build failures immediately** - don't accumulate tech debt
6. ✅ **Document environment variables** in `ENV_VARIABLES_FOR_VERCEL.txt`
7. ✅ **Check Prisma schema** before pushing schema changes
8. ✅ **Commit lockfile** (`pnpm-lock.yaml`) to ensure reproducible builds

---

## ✅ **Current Status**

**Branch:** `feature/subscription-modeling-phase1`  
**Latest Commit:** `c91fa0a` (includes PlanStatus enum fix)  
**Deployment:** Triggered automatically after push  
**Preview URL:** Will be available in Vercel dashboard shortly

**Previous Issue:** Commit `e472685` failed (PlanStatus enum missing DRAFT)  
**Resolution:** Fixed in commit `d1fa52a`, redeploying with `c91fa0a`

---

**Questions?** Check Vercel dashboard or review build logs.

