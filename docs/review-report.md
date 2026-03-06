# Code Review Report

**Branch:** `feat/academic`  
**Date:** 2026-03-07    
**Reviewer:** AI Code Review Agent  
**Scope:** Uncommitted changes — Dashboard feature implementation

---

## Summary

This change introduces a new **Dashboard** feature that replaces mock data with real API-backed data on the `admin-staff` dashboard. The implementation spans both the backend (NestJS) and frontend (TanStack Start / React Query).

**✅ Pass 2 Update:** The author has successfully implemented fixes for all critical, major, and minor issues raised in the initial review, and smoothly integrated Workspace Context filtering via `academicYearId` and `academicPeriodId`.

**✅ Pass 3 Update:** The remaining "Placeholder Stats" (schedule completion, unused subjects, and data issues) have now been fully implemented with real, optimized database queries. Impressively, this includes cross-checking class subjects, schedules, and identifying teacher overlapping schedule conflicts — all cleanly integrated into the frontend alerts and stat cards. This code is rock-solid.

### Files Reviewed

| File | Type | Status |
|---|---|---|
| `apps/backend/src/dashboard/dashboard.service.ts` | New | ✅ Excellent |
| `apps/backend/src/dashboard/dashboard.controller.ts` | New | ✅ Excellent |
| `apps/backend/src/dashboard/dashboard.module.ts` | New | ✅ Excellent |
| `apps/backend/src/app.module.ts` | Modified | ✅ Excellent |
| `apps/academic/src/lib/services/api/dashboard/api.client.ts` | New | ✅ Excellent |
| `apps/academic/src/lib/services/api/dashboard/types.ts` | New | ✅ Excellent |
| `apps/academic/src/lib/services/api/dashboard/keys.ts` | New | ✅ Excellent |
| `apps/academic/src/lib/services/api/dashboard/index.ts` | New | ✅ Excellent |
| `apps/academic/src/lib/hooks/dashboard/use-get-admin-staff-dashboard.ts` | New | ✅ Excellent |
| `apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/index.tsx` | Modified | ✅ Excellent |
| `apps/academic/src/routeTree.gen.ts` | Modified | ✅ Auto-generated (do not edit) |

---

## ✅ Resolved Issues

### 1. Fragile Response Handling with `any` Cast in `api.client.ts` (Critical)
**Issue:** Dual-path response handling using `as any` and `as unknown as` obscured type safety.
**Resolution:** Logic was simplified to return `response.data` correctly utilizing the shared `ApiResponse` type.

### 2. Locally Redeclared `ApiResponse<T>` (Critical)
**Issue:** Redefined a global type locally, violating DRY.
**Resolution:** Local definition was removed and successfully imported from `src/lib/services/api/api.types.ts`.

### 3. Missing `index.ts` Barrel File (Major)
**Issue:** Violated frontend-implementation guidelines.
**Resolution:** `index.ts` was added to export `api.client`, `types`, and `keys`.

### 4. Hardcoded School Name (Major)
**Issue:** Returned "Ziqola" for all tenants.
**Resolution:** Added a Prisma query to correctly fetch the tenant's actual name.

### 5. Hardcoded Placeholder Stats (Major)
**Issue:** Returning 0 for unimplemented stats misled users.
**Resolution:** Now correctly returns `null`, and the frontend gracefully handles this by rendering "Segera hadir" or "-".

### 6. `@Roles()` Cast with `as any` (Major)
**Issue:** Suppressed TypeScript mismatch errors, bypassing type safety.
**Resolution:** Removed `as any` casts and correctly imported `Role` from the shared enum.

### 7. Missing `queryOptions` Factory (Major)
**Issue:** Inline query options rather than reusing a factory.
**Resolution:** `dashboardQueryOptions` factory was introduced in `api.client.ts` and successfully utilized in the custom hook.

### 8. Import Order Violation (Minor)
**Issue:** Hook was imported in the middle of `index.tsx`.
**Resolution:** Hook import moved to the top underneath node modules block.

### 9. Skeleton/Loading UI Duplication (Minor)
**Issue:** JSX for the skeleton loader was duplicated in two spots.
**Resolution:** Extracted into a reusable `<DashboardSkeleton />` component.

### 10. Activity Log — Actor Name Not Used (Minor)
**Issue:** Fallback to raw `actorId` UUID.
**Resolution:** Data mapped beautifully: ``Oleh: ${log.actor?.name ?? log.actorId ?? 'Sistem'}``.

### 11. `N/A` as a Stat Card Value (Minor)
**Issue:** `N/A` is poor UX.
**Resolution:** `null` states are now robustly handled falling back to `-` or `Segera hadir`.

---

## ✅ What's Done Well

1. **NestJS module structure is correct**: `DashboardModule` correctly imports `PrismaModule`, uses proper DI with `PrismaService`, and registers the controller/service properly.
2. **RBAC guards are applied**: The controller correctly uses `JwtAuthGuard` + `RolesGuard` and restricts access to the appropriate roles.
3. **Multi-tenant data isolation**: All Prisma queries correctly scope by `tenantId`.
4. **Parallel DB queries**: `Promise.all()` is used for the four main count queries, which is a performance win.
5. **Clean API Architecture**: Query keys factory and client hooks pattern are strictly adhered to, allowing for easy server-side usage if required later.
6. **Graceful degradation**: The frontend elegantly handles `null` API values for features that are still "Coming Soon."
7. **Workspace Context Integration**: The new query filtering appropriately utilizes the `useWorkspaceStore` on the frontend, accurately passing `academicYearId` and `academicPeriodId` to the NestJS backend which gracefully falls back to `ACTIVE` values, maintaining correct UI scoping.
8. **Robust Dynamic Statistics**: Replaced all remaining placeholder zeroes with actual database calculations, successfully integrating `schedulePercentage`, identifying schedule conflicts for teachers, and uncovering classes missing complete schedules.

## Conclusion
**Status:** **APPROVED** 🟢
The implementation has successfully cleared all rounds of code review. The addition of global workspace filtering and the dynamic calculation of complex schedule integrity queries makes this an exceptionally comprehensive dashboard feature. Ready to be staged and committed.
