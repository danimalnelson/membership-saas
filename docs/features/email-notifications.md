# Feature: Email Notifications

## Overview
Send automated email notifications for key events using Resend templates.

## Email Types
1. **New Member Welcome** - Sent when member signs up
2. **Payment Failed** - Sent when subscription payment fails
3. **Monthly Summary** - Sent to business owners with stats

## Implementation (Simplified for MVP)

### Email Template Functions
Create email template helpers in `packages/emails/`:
- `sendWelcomeEmail(to, memberName, businessName)`
- `sendPaymentFailedEmail(to, memberName, amount)`
- `sendMonthlySummaryEmail(to, businessName, stats)`

### Integration Points
- Webhook handler for payment events
- Member creation flow
- Scheduled job placeholder for monthly summaries

### Testing
- Unit tests for email formatting
- Mock Resend API calls

## Files to Create
1. `packages/emails/templates.tsx` - Email templates
2. `apps/web/tests/unit/email-templates.test.ts` - Tests

## Success Criteria
- ✅ Email templates defined
- ✅ Helper functions created
- ✅ Tests passing

