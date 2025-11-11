# Security Guidelines

## 🔐 Preventing Secret Exposure

### Rules for Developers & AI Agents

**NEVER commit:**
1. API keys (Stripe, Resend, etc.)
2. Database credentials or connection strings
3. OAuth secrets
4. Private keys or certificates
5. Session secrets or JWT tokens
6. Any `.env` files

### Using Environment Variables

**✅ DO:**
```typescript
// Good: Reference environment variables
const apiKey = process.env.STRIPE_SECRET_KEY;
const dbUrl = process.env.DATABASE_URL;
```

**❌ DON'T:**
```typescript
// Bad: Hardcoded secrets
const apiKey = "sk_test_xxxxx";
const dbUrl = "postgresql://user:pass@host/db";
```

### Test Configuration

For test configs (`vitest.config.ts`, `playwright.config.ts`):

**✅ DO:**
```typescript
env: {
  DATABASE_URL: process.env.DATABASE_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
}
```

**❌ DON'T:**
```typescript
env: {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://...",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_...",
}
```

### Local Development Setup

1. Copy `ENV_VARIABLES_FOR_VERCEL.txt` values to `.env.local`:
```bash
cp ENV_VARIABLES_FOR_VERCEL.txt .env.local
# Edit .env.local with your local values
```

2. **Never commit `.env.local`** - it's in `.gitignore`

### Pre-commit Checks

We use Husky pre-commit hooks to scan for secrets:
```bash
pnpm install  # Installs Husky hooks
```

### CI/CD Setup

In GitHub Actions or Vercel, set secrets as:
- **GitHub**: Settings → Secrets and variables → Actions
- **Vercel**: Settings → Environment Variables

### Manual Secret Scanning

Run before pushing:
```bash
# Using grep
git diff main | grep -E "(sk_|pk_|whsec_|re_[A-Za-z0-9]{20,})"

# Using gitleaks (if installed)
gitleaks detect --source . --verbose
```

### If You Accidentally Commit Secrets

1. **Immediately rotate the exposed secrets:**
   - Stripe: https://dashboard.stripe.com/apikeys
   - Resend: https://resend.com/api-keys
   - Database: Change password in provider dashboard

2. **Remove from git history:**
```bash
git filter-repo --invert-paths --path apps/web/vitest.config.ts
# Or use GitHub's secret scanning "Revoke" option
```

3. **Force push the cleaned history:**
```bash
git push origin main --force
```

### GitHub Secret Scanning

- ✅ GitHub Push Protection is **enabled**
- Blocks pushes containing detected secrets
- Provides URL to allow or revoke

### Agent Instructions

**For AI coding agents:**
```
CRITICAL RULE: When configuring test environments or development setups:
1. NEVER use hardcoded API keys, tokens, or credentials
2. ALWAYS reference process.env variables without fallback values
3. ALWAYS check files for secrets before committing
4. If tests need secrets, document "must set in .env.local" instead
```

## Reporting Security Issues

Found a security vulnerability? Email: security@yourdomain.com

**Do not** open public GitHub issues for security vulnerabilities.

---

Last updated: November 11, 2025

