# Phase 2: Code Quality Deep Dive - Baseline

**Date:** November 13, 2025  
**Branch:** `refactor/code-quality-phase2-2025-11-13`  
**Status:** IN PROGRESS

---

## 📊 Starting Metrics

**Tests:** 93/93 passing ✅  
**Build:** Successful ✅  
**Type Coverage:** ~85% (estimated)

---

## 🔍 Any Type Audit

### Total Found: 31 occurrences

### Category 1: Intentional/Acceptable (15)
**Reason:** Avoiding circular imports or flexible by design

1. `packages/lib/auth-helpers.ts` (3x) - `prisma: any` to avoid importing PrismaClient
2. `packages/lib/api-auth.ts` (4x) - `prisma: any`, flexible return types
3. `packages/lib/api-errors.ts` (7x) - `details?: any` for flexible error context
4. Catch blocks (6x) - `error: any` (TypeScript standard pattern)

**Action:** Keep with explanatory comments

### Category 2: Should Be Fixed (16)

#### High Priority (Type Safety Issues)
1. ✅ **`packages/lib/business-state-machine.ts`** (2x)
   - `requirements?: any` → Use proper Stripe type
   - `capabilities?: any` → Use proper Stripe type

2. ✅ **`apps/web/src/app/api/business/[businessId]/sync-stripe/route.ts`**
   - `updateData: any` → Use `Prisma.BusinessUpdateInput`

3. ✅ **`apps/web/src/app/api/embed/[slug]/plans/route.ts`** (2x)
   - `plan: any` → Proper Prisma type
   - `price: any` → Proper Prisma type

#### Medium Priority (Cache/Data Types)
4. ✅ **Cache type definitions** (2x)
   - `Map<string, { data: any; timestamp: number }>` → Use proper generic types

---

## 📋 Phase 2 Goals

### 1. Eliminate `any` Types
- [ ] Fix Stripe types in business-state-machine
- [ ] Fix Prisma types in API routes
- [ ] Improve cache type definitions
- [ ] Add comments for intentional `any` usage

### 2. Add Zod Validation
- [ ] Install Zod dependency
- [ ] Create validation schemas for all API routes
- [ ] Implement validation middleware
- [ ] Add validation error handling

### 3. Refactor Duplicate Code
- [ ] Audit for remaining duplication
- [ ] Extract common patterns
- [ ] Create shared utilities

### 4. Add Unit Tests
- [ ] Test `api-auth.ts` utilities
- [ ] Test `api-errors.ts` utilities
- [ ] Test validation schemas
- [ ] Integration tests for auth flow

---

## 🎯 Success Criteria

- ✅ 0 unnecessary `any` types
- ✅ All API routes have Zod validation
- ✅ 90%+ test coverage for utilities
- ✅ All tests passing (93/93+)
- ✅ Build successful
- ✅ Type coverage > 95%

---

**Status:** Ready to begin implementation

