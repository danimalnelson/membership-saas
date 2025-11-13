# Phase 3 Performance Baseline Metrics

**Date:** November 13, 2025 21:59
**Branch:** refactor/performance-phase3-2025-11-13

## Bundle Size Analysis

### Shared JS (First Load)
- **Total:** 102 kB
- **Target:** < 80 kB (-22%)

### Route Breakdown
| Route | Size | First Load JS |
|-------|------|---------------|
| / (home) | 183 B | 105 kB |
| /[slug] (public page) | 183 B | 105 kB |
| /[slug]/auth/signin | 2.26 kB | 112 kB |
| /[slug]/plans/[planId] | 2.74 kB | 112 kB |
| /[slug]/success | 1.78 kB | 115 kB |
| API routes | 191 B each | 102 kB |

## Component Analysis

### Large/Complex Components
1. **BusinessDashboardPage** (`app/app/[businessId]/page.tsx`)
   - ~330 lines
   - Multiple Prisma queries
   - Complex status gates
   - MRR calculations

2. **AppHomePage** (`app/app/page.tsx`)
   - Business listing
   - Prisma query with includes
   - Image rendering (unoptimized)

3. **BusinessLandingPage** (`[slug]/page.tsx`)
   - Public-facing
   - Plan rendering
   - Image usage

4. **MembersPage** (`app/[businessId]/members/page.tsx`)
   - Large data tables
   - Potential for virtual scrolling

### Client Components
- CopyButton (already memoized ✅)
- DashboardHeader (already memoized ✅)
- AppHeader (already memoized ✅)
- ErrorBoundary (Class component, optimized ✅)

## Optimization Opportunities

### High Priority
1. **Image Optimization**
   - Replace `<img>` with Next.js `<Image>`
   - Logo images in business listings
   - Plan images

2. **Code Splitting**
   - Heavy Stripe components
   - Dashboard charts/analytics
   - Admin-only features

3. **React Performance**
   - Add useCallback to event handlers
   - Memoize expensive calculations (MRR)
   - Optimize member lists

### Medium Priority
4. **Font Loading**
   - Audit font strategy
   - Implement font-display: swap

5. **Virtual Scrolling**
   - Member lists (when >50 items)
   - Transaction history

6. **Prefetching**
   - Dashboard data
   - Common navigation paths

### Low Priority
7. **Service Worker**
   - Offline support
   - Cache static assets

8. **Advanced Caching**
   - Redis/KV for API responses

## Success Criteria
- [ ] Bundle size < 80 kB (-22%)
- [ ] All images use Next.js Image
- [ ] No unoptimized <img> tags
- [ ] Code splitting for heavy features
- [ ] useCallback on all event handlers
- [ ] Memoized expensive calculations
- [ ] All tests passing (129/129)

