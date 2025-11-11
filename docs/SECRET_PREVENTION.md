# How We Prevent API Secret Exposure

## 🛡️ Multi-Layer Security Approach

This document explains all the measures implemented to prevent API secrets from being exposed in commits or pushed to GitHub.

---

## Layer 1: Pre-Commit Hook

**File:** `.husky/pre-commit`

**What it does:**
- Automatically runs before every `git commit`
- Scans staged files for secret patterns:
  - Stripe keys: `sk_live_`, `sk_test_`, `pk_live_`, `pk_test_`, `whsec_`
  - Resend API keys: `re_[A-Za-z0-9]{20,}`
  - Database credentials: `postgresql://user:pass@host`
  - Other API keys: `npg_[A-Za-z0-9]+`

**If secrets detected:**
```bash
❌ ERROR: Possible API secret detected in staged files!
Please remove secrets and use environment variables instead.
# Commit is blocked
```

**To test:**
```bash
echo "const key = 'sk_test_abc123';" > test.ts
git add test.ts
git commit -m "test"  # Will be blocked
```

---

## Layer 2: Enhanced .gitignore

**File:** `.gitignore`

**Patterns added:**
```gitignore
# Environment files
.env
.env*.local
**/.env*

# Build artifacts
**/.next/
**/out/

# Sensitive files
**/secrets.json
**/credentials.json
**/*-secret-*
**/*apikey*
**/*secret-key*
```

**Result:**  
- All `.env` files are automatically ignored
- No build artifacts committed
- Common secret file patterns blocked

---

## Layer 3: GitHub Push Protection

**Status:** ✅ **Active** (already configured in your repo)

**What it does:**
- GitHub scans every push for known secret patterns
- Blocks pushes containing detected secrets
- Provides URL to review/allow if needed

**Example from today:**
```
remote: error: GH013: Repository rule violations found
remote: - Push cannot contain secrets
remote: - Stripe Test API Secret Key detected
```

**Override (use carefully):**  
GitHub provides a URL to temporarily allow specific secrets (e.g., for test fixtures).

---

## Layer 4: Gitleaks Configuration

**File:** `.gitleaksignore`

**Purpose:**  
Whitelist known false positives (e.g., documentation examples).

**Example:**
```
# Documentation file with example values (not real secrets)
ENV_VARIABLES_FOR_VERCEL.txt:*
```

---

## Layer 5: Code Review Rules

**File:** `SECURITY.md`

**Guidelines for developers and AI agents:**

### ✅ DO:
```typescript
// Reference environment variables
const apiKey = process.env.STRIPE_SECRET_KEY;
```

### ❌ DON'T:
```typescript
// Hardcode secrets or fallback values
const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_abc";
```

---

## Layer 6: Cursor AI Rules

**File:** `.cursorrules`

**AI-specific instructions:**
- Never include API keys in code/config
- Always reference `process.env.*` without fallbacks
- Document "Set in .env.local" for local dev
- Check files for secrets before committing

**Pre-commit checklist enforced:**
1. ✅ No hardcoded API keys
2. ✅ No database credentials
3. ✅ Environment variables used correctly
4. ✅ All tests passing
5. ✅ No console.logs with sensitive data

---

## How to Use Environment Variables Correctly

### Local Development

1. **Copy template to `.env.local`:**
```bash
cp ENV_VARIABLES_FOR_VERCEL.txt .env.local
```

2. **Edit `.env.local` with your values:**
```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
```

3. **Never commit `.env.local`** - it's in `.gitignore`

### Test Configuration

**vitest.config.ts:**
```typescript
env: {
  DATABASE_URL: process.env.DATABASE_URL,  // ✅ No fallback
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
}
```

### CI/CD

**GitHub Actions:**
- Settings → Secrets and variables → Actions
- Add each secret individually

**Vercel:**
- Settings → Environment Variables
- Add for Production, Preview, Development

---

## If You Accidentally Commit Secrets

### Immediate Actions:

1. **Rotate the exposed secrets immediately:**
   - Stripe: https://dashboard.stripe.com/apikeys
   - Resend: https://resend.com/api-keys
   - Database: Change password in provider dashboard

2. **Remove from git history:**
```bash
# Use GitHub's secret scanning "Revoke" option
# Or use git-filter-repo to rewrite history
git checkout -b clean-branch <commit-before-secret>
git cherry-pick <commits-to-keep>
git push origin clean-branch --force
```

3. **Verify secret is gone:**
```bash
git log --all --full-history -p -- <file-with-secret>
```

---

## Testing the Security Measures

### Test Pre-Commit Hook:
```bash
# Create file with fake secret
echo "sk_test_fake123" > test-secret.ts
git add test-secret.ts
git commit -m "test"  # Should be blocked
```

### Test .gitignore:
```bash
# Try to add .env file
echo "SECRET=abc" > .env
git status  # Should not show .env
```

### Manual Secret Scan:
```bash
# Search for common secret patterns
git diff main | grep -E "(sk_|pk_|whsec_|re_[A-Za-z0-9]{20,})"
```

---

## Summary of Protection Layers

| Layer | File | Status | Purpose |
|-------|------|--------|---------|
| 1 | `.husky/pre-commit` | ✅ Active | Block commits with secrets |
| 2 | `.gitignore` | ✅ Active | Ignore sensitive files |
| 3 | GitHub Push Protection | ✅ Active | Block pushes with secrets |
| 4 | `.gitleaksignore` | ✅ Active | Manage false positives |
| 5 | `SECURITY.md` | ✅ Active | Developer guidelines |
| 6 | `.cursorrules` | ✅ Active | AI agent instructions |

---

## Quick Reference

**Before every commit, ensure:**
- ✅ No `sk_*`, `pk_*`, `re_*` in code
- ✅ No database URLs with credentials
- ✅ All config uses `process.env.*` only
- ✅ Pre-commit hook has run (automatic)

**For team members:**
- Read `SECURITY.md` before contributing
- Copy `ENV_VARIABLES_FOR_VERCEL.txt` → `.env.local`
- Never commit `.env*` files
- If secrets exposed → rotate immediately

**For AI agents:**
- Follow `.cursorrules` strictly
- Never suggest hardcoded secrets
- Always use environment variables
- Document "Set in .env.local" for local setup

---

**Last incident:** November 11, 2025  
**Resolution:** History rewritten, secrets removed, 6 protection layers implemented  
**Status:** ✅ **No secrets in repository** (verified via GitHub secret scanning)

