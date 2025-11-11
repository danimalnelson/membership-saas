# Mission Objective — Feature Expansion Sprint

## Goal
Autonomously design, implement, and test new product features on top of the existing B2B2C SaaS foundation.  
Each feature must ship with passing tests, safe commits, and clear progress logs.

---

## Priority Features

1. **Business Profile Management**
   - Edit business name, logo, contact info, and branding colors.
   - Sync these fields with Stripe account metadata.
   - Add corresponding `/api/business/update` route and dashboard UI form.

2. **Analytics Dashboard**
   - Show MRR, active members, churn, and revenue trends.
   - Build `/api/metrics` endpoint and React chart components (Recharts).
   - Cache metrics for performance.

3. **Email Notifications**
   - Integrate Resend templates for:
     - New member sign-ups.
     - Failed payment notifications.
     - Monthly summary emails to business owners.
   - Add `/packages/emails` for modular templates.

4. **Public Business Page Enhancements**
   - Improve layout with logo, banner, and brand colors.
   - Add monthly/yearly toggle on pricing cards.
   - Fetch live plan data from connected Stripe account.

5. **Member Portal Improvements**
   - Allow consumers to view invoices and upgrade/downgrade plans.
   - Add “Manage Plan” button linking to the Stripe Customer Portal.

6. **Developer Experience**
   - Generate `/docs/api.md` automatically from route handlers.
   - Add typed SDK stubs in `/packages/sdk/` for platform API calls.

---

## Process

1. **Plan**
   - For each feature, generate `/docs/features/<feature>.md` summarizing:
     - Overview
     - Implementation outline
     - Test strategy (unit, integration, E2E)

2. **Implement**
   - Create branch `feature/<name>`.
   - Code feature incrementally following plan.

3. **Generate Tests**
   - Auto-generate new test files:
     - `tests/unit/<feature>.test.ts`
     - `tests/integration/<feature>.test.ts`
     - `tests/e2e/<feature>.spec.ts`
   - Ensure coverage for API, UI, and database logic.

4. **Run Verification**
   - Execute:
     ```bash
     bash scripts/run-full-tests.sh
     ```
   - Fix failing tests or build errors automatically.

5. **Commit & Push**
   - If all tests pass:
     ```bash
     git add .
     git commit -m "feat(<feature>): implemented with tests"
     git push origin feature/<name>
     ```
   - Append a summary entry to `/logs/feature-progress.md`.

6. **Merge & Regression**
   - Merge branch only after all tests (old + new) pass.
   - Re-run onboarding & payment tests for regressions.

7. **Iterate**
   - Move to the next feature in this list until all are complete.

---

## Autonomy Loop
- Always verify build + test results before committing.
- Skip broken commits.
- Repeat until every feature has a working implementation and full test coverage.
- When all features pass, generate `/logs/final-feature-summary.md` with the outcomes.

---

## Safety & Rules
- Never push secrets or .env values.
- Keep Prisma migrations atomic.
- Prefer minimal, clear commits over bulk edits.
- Stop and summarize if three consecutive builds fail.

---

## Exit
Stop when all features are complete, merged, and tested in both local and Vercel environments.

---

## Idle Recovery & Timeout Handling
If any command stalls or produces no output for >5 minutes, assume a hang:
1. Terminate the process safely.
2. Log a summary to `/logs/feature-progress.md` with `[TIMEOUT DETECTED]` and the last step run.
3. Restart the next full test cycle automatically using `bash scripts/run-full-tests.sh`.
