# Feature: Business Profile Management

## Overview
Allow business owners to edit their business profile information including name, logo, contact details, and branding colors. These fields will sync with Stripe account metadata for consistent branding across payment experiences.

## Implementation Outline

### 1. Database Schema Updates
- Add fields to `Business` model:
  - `logoUrl` (String, optional)
  - `contactEmail` (String, optional)
  - `contactPhone` (String, optional)
  - `brandColorPrimary` (String, optional, default: theme color)
  - `brandColorSecondary` (String, optional)
  - `description` (String, optional, for public page)
  - `website` (String, optional)

### 2. API Endpoints

**PATCH `/api/business/[businessId]/profile`**
- Update business profile fields
- Validate ownership (OWNER or ADMIN role required)
- Sync updates to Stripe Connect account metadata
- Return updated business object

**GET `/api/business/[businessId]`** (already exists, enhance)
- Include new profile fields in response

### 3. UI Components

**Settings Page: `/app/[businessId]/settings`**
- Business Profile section with form fields:
  - Business Name (text input)
  - Logo Upload (file input with image preview)
  - Contact Email (email input)
  - Contact Phone (tel input)
  - Website (url input)
  - Description (textarea)
  - Primary Brand Color (color picker)
  - Secondary Brand Color (color picker)
- Save button with loading state
- Success/error toast notifications

### 4. Stripe Integration
- Update Stripe Connect account metadata when profile changes
- Sync business name to `account.business_profile.name`
- Store logo URL in account metadata
- Update brand colors in account settings if supported

## Test Strategy

### Unit Tests (`tests/unit/business-profile.test.ts`)
- ✅ Validate profile update payload schema
- ✅ Test field validation (email format, URL format, hex colors)
- ✅ Test phone number validation
- ✅ Test unauthorized access rejection
- ✅ Test non-existent business handling

### Integration Tests (`tests/integration/business-profile.test.ts`)
- ✅ Full profile update flow with database
- ✅ Stripe metadata sync verification
- ✅ Logo upload and storage
- ✅ Multiple users accessing same business
- ✅ Audit log creation for profile changes

### E2E Tests (`tests/e2e/business-profile.spec.ts`)
- ✅ Navigate to settings page
- ✅ Update business name and see change reflected
- ✅ Upload logo and verify preview
- ✅ Change brand colors and see UI update
- ✅ Save profile and verify success message
- ✅ Reload page and verify changes persisted

## Database Migration
```prisma
model Business {
  // ... existing fields
  logoUrl              String?
  contactEmail         String?
  contactPhone         String?
  website              String?
  description          String?
  brandColorPrimary    String?   @default("#6366f1")
  brandColorSecondary  String?
  updatedAt            DateTime  @updatedAt
}
```

## Files to Create/Modify
1. `packages/db/prisma/schema.prisma` - Add new fields
2. `apps/web/src/app/api/business/[businessId]/profile/route.ts` - New API endpoint
3. `apps/web/src/app/app/[businessId]/settings/page.tsx` - Settings UI
4. `packages/lib/validations.ts` - Add profile validation schemas
5. `apps/web/tests/unit/business-profile.test.ts` - Unit tests
6. `apps/web/tests/integration/business-profile.test.ts` - Integration tests
7. `apps/web/tests/e2e/business-profile.spec.ts` - E2E tests

## Success Criteria
- ✅ All new fields editable via settings page
- ✅ Changes persist to database
- ✅ Stripe metadata syncs correctly
- ✅ All tests passing (unit, integration, E2E)
- ✅ No regressions in existing onboarding tests
- ✅ Type-safe throughout with Zod validation

