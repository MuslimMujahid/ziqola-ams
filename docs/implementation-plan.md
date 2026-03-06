# Dashboard Fixes Implementation Plan

This plan outlines the steps to resolve issues highlighted in `docs/review-report.md` as well as the TypeScript import compilation errors currently preventing `dashboard.module.ts` from compiling.

## User Review Required
No major architectural shifts. Review the approach to handling the currently uncalculated dashboard stats below.

## Proposed Changes

### Backend
#### [MODIFY] apps/backend/src/dashboard/dashboard.service.ts
- **Fix Hardcoded Tenant**: Replace static `"Ziqola"` with actual database fetch: `const tenant = await this.prisma.client.tenant.findUnique({ where: { id: tenantId }, select: { name: true } })`.
- **Fix Placeholders**: Instead of showing `0`, make placeholder stats (e.g. `unusedSubjectsCount`, `incompleteSchedulesClassCount`, `dataIssuesCount`) return `null` or omit them until implemented, allowing frontend to adapt accurately without misleading users.
- **Fix Audit Log Mapping**: Update the `detail` property to use the joined actor name: `` `Oleh: ${log.actor?.name ?? log.actorId ?? 'Sistem'}` ``.
- **Fix Placeholders Links**: Remove inline comment placeholders from checklist items and map to realistic expected frontend routes like `/dashboard/admin-staff/class-management`.

#### [MODIFY] apps/backend/src/dashboard/dashboard.controller.ts
- **Fix Type Error**: Resolve the TypeScript compilation error causing "Cannot find module './dashboard.controller'". The issue stems from `@Roles(Role.ADMIN_STAFF as any, Role.PRINCIPAL as any)`. Remove `as any` and import `Role` strictly from `@repo/db`, updating generic constraints on `Roles` decorator if necessary to prevent the TS parsing failure that breaks `dashboard.module.ts`.

### Frontend
#### [MODIFY] apps/academic/src/lib/services/api/dashboard/api.client.ts
- **Refactor Response Handling**: Remove the fragile `as any` cast logic. Assume the NestJS backend returns the payload directly and clean the wrapper approach if possible, or expect standard `data.data` unwrap.
- **Remove Local Type**: Delete local duplicate `ApiResponse<T>` and import the centralized one from `api.types.ts`.

#### [NEW] apps/academic/src/lib/services/api/dashboard/index.ts
- **Add Barrel File**: Create the missing `index.ts` file extending exports for `api.client`, `keys`, and `types`.

#### [MODIFY] apps/academic/src/lib/hooks/dashboard/use-get-admin-staff-dashboard.ts
- **Implement Factory Pattern**: Extract `.adminStaffSummary()` invocation into a structured `dashboardQueryOptions` factory to avoid inline `queryFn` and `queryKey` definitions directly inside the hook.

#### [MODIFY] apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/index.tsx
- **Fix Import Order**: Move the `useGetAdminStaffDashboard` hook import to the top of the file, above all local constants.
- **Refactor Skeleton UI**: Move the inline skeleton loading markup to a separate reusable `DashboardSkeleton` React component inside the file.
- **Remove `N/A` text**: Instead of returning raw `"N/A"`, gracefully hide or fallback the value dynamically based on whether backend provides `null` or actual figures for unimplemented statistics like `incompleteSchedulesClassCount`.

## Verification Plan

### Automated Tests
Since there are no `*.spec.ts` files related specifically to the dashboard at present, verification will heavily rely on compilation and linter passing.
- Run `pnpm --filter backend build` to verify that `dashboard.module.ts` properly imports and compiles `dashboard.controller.ts` without errors.
- Run `pnpm --filter academic check` to confirm Biome passes all formatting/linting rules on the frontend fixes.
- Run `pnpm --filter academic build` to verify frontend production build succeeds with the new strict typings.

### Manual Verification
1. Launch `pnpm dev`
2. Authenticate locally into the UI via the development environment
3. Load the `/dashboard/admin-staff` route
4. Ensure the dashboard mounts properly, the correct school name renders in place of 'Ziqola', and skeleton loaders fire correctly before rendering the stats cards.
