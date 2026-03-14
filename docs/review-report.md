# Code Review Report

**Date:** 2026-03-14  
**Reviewer:** Antigravity (AI Code Review Agent)  
**Feature:** Automate School Code (Slug) Generation — remove manual `schoolCode` field, derive slug from school name  
**Files Reviewed:**

| File | Scope |
|---|---|
| `apps/backend/src/tenants/dto/register-tenant.dto.ts` | Backend DTO |
| `apps/backend/src/tenants/tenants.service.ts` | Backend Service |
| `apps/academic/src/lib/services/api/tenant/api.server.ts` | Frontend Server Function |
| `apps/academic/src/lib/services/api/tenant/tenant.types.ts` | Frontend Types |
| `apps/academic/src/components/auth/register-form.tsx` | Frontend Component |

---

## Summary

This change removes the manual `schoolCode` input and replaces it with an auto-generated slug derived from the school name on the backend. The implementation is clean overall, but there are several notable issues around slug collision handling, dead code cleanup, error message coupling, and minor frontend code quality concerns that should be addressed before merging.

---

## ✅ What's Good

- **Correct architecture:** Slug generation is correctly placed server-side in `TenantsService.registerTenant()`, which is the right layer for this kind of business logic.
- **Good slug algorithm:** `trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")` handles Unicode spaces, special characters, and leading/trailing hyphens correctly.
- **DTO validation retained:** `RegisterTenantDto` still validates `schoolName` with `@MinLength(2)` / `@MaxLength(160)`, preventing degenerate slugs from empty or excessively long names.
- **Frontend Zod schema stays consistent:** `api.server.ts` removes `schoolCode` from validation — it now mirrors the updated DTO correctly.
- **Type cleanup is complete:** `RegisterTenantVars` in `tenant.types.ts` correctly has `schoolCode` removed, maintaining type-safety across the full stack.
- **Transaction still used properly:** The `prisma.$transaction()` wrapping of tenant + user creation is intact and correct.
- **Proper error feedback:** The frontend catches the `"school name or generated slug"` error string and routes the user back to the school step with a meaningful error.

---

## 🔴 Critical Issues

### 1. `checkSchoolCodeAvailability` is dead code

**File:** `apps/backend/src/tenants/tenants.service.ts` (lines 134–142)

```typescript
async checkSchoolCodeAvailability(schoolCode: string) {
  const normalized = schoolCode.trim().toLowerCase();
  const existing = await this.prisma.client.tenant.findFirst({
    where: { slug: normalized },
    select: { id: true },
  });
  return { available: !existing };
}
```

The school code availability check endpoint existed solely to support the manual code input field. With that field removed, this method (and its corresponding controller endpoint and frontend hook `useCheckSchoolCodeAvailability`) is now dead code. Leaving it in place:
- Creates confusion about whether it's still intentionally used.
- Leaves an unauthenticated API endpoint that enumerates slug usage (potential information disclosure).

**Recommendation:** Remove this method from `TenantsService`, along with its controller binding and any remaining frontend hook/query (`useCheckSchoolCodeAvailability`).

> [!CAUTION]
> Check `apps/academic/src/components/auth/register-form.tsx` line 8 — `CheckCircleIcon`, `Loader2Icon`, and `XCircleIcon` are still imported but `Loader2Icon` and the icon pair are ONLY used inside `AdminStepForm`. Verify no dead imports remain from the old availability UI.

---

### 2. Slug collision gives no actionable feedback to the user

**File:** `apps/academic/src/components/auth/register-form.tsx` (lines 113–115)

```typescript
if (message.toLowerCase().includes("school name or generated slug")) {
  setServerError("Nama sekolah atau slug sudah digunakan. Gunakan nama lain.");
  setStep("school");
  return;
}
```

This is correct behavior, but the user only sees a generic error with no indication of *what* specific name was a conflict. A user registering "SMA Negeri 1 Bandung" that conflicts with an existing slug `sma-negeri-1-bandung` will have no way to know they need to slightly change spelling.

**Recommendation:** Consider displaying the auto-generated slug preview in the form UI so users understand what slug will be generated before they submit. A helper text like `"Slug yang akan digunakan: sma-negeri-1-bandung"` would significantly improve UX and reduce confusion during conflicts.

---

## 🟡 Medium Issues

### 3. Error message coupling between backend and frontend is fragile

**Backend** (`tenants.service.ts` line 169):
```typescript
throw new ConflictException("School name or generated slug already exists");
```

**Frontend** (`register-form.tsx` line 113):
```typescript
if (message.toLowerCase().includes("school name or generated slug")) {
```

The frontend is performing substring matching against a raw backend error message string. This is a brittle pattern:
- A typo or rephrasing on the backend silently breaks the frontend error routing.
- The frontend would fallback to the generic "Registrasi gagal" message without logging or visibility.

**Recommendation:** Use a machine-readable error code instead (e.g., HTTP 409 status code or a structured `{ code: "SLUG_CONFLICT" }` response body). TanStack Start server functions should propagate response shapes that the frontend can safely pattern-match on.

---

### 4. Slug may be empty for edge-case school names

**File:** `apps/backend/src/tenants/tenants.service.ts` (lines 155–159)

```typescript
const normalizedCode = dto.schoolName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");
```

For a school name consisting *entirely* of non-ASCII characters (e.g., Arabic or Chinese characters), `normalizedCode` will be an empty string `""`. Example: `"مدرسة"` → `""`.

While the system is for Indonesian schools (where Latin characters are common), the `educationLevel` options include `OTHER`, and school names could theoretically be non-Latin.

**Recommendation:** Add a guard after slug generation:

```typescript
if (!normalizedCode) {
  throw new BadRequestException(
    "School name must contain at least one letter or number for slug generation",
  );
}
```

Alternatively, append a random suffix or UUID fragment as a fallback slug.

---

### 5. Duplicate `EDUCATION_LEVEL_VALUES` constant

**Files affected:**
- `apps/backend/src/tenants/dto/register-tenant.dto.ts` (line 12)
- `apps/academic/src/lib/services/api/tenant/api.server.ts` (line 6)
- `apps/academic/src/components/auth/register-form.tsx` (lines 31)

The same constant is redefined in three places. While this is a pre-existing issue (not introduced by this PR), it's worth noting.

**Recommendation:** Define this in `@repo/db` or a shared package so all layers import from a single source of truth.

---

## 🔵 Minor Issues / Style

### 6. Stale unused imports in `register-form.tsx`

**File:** `apps/academic/src/components/auth/register-form.tsx`, line 8

```typescript
import { CheckCircleIcon, Loader2Icon, XCircleIcon } from "lucide-react";
```

After removing the school code availability UI, `CheckCircleIcon`, `Loader2Icon`, and `XCircleIcon` should be verified — they are still needed in `AdminStepForm` for email availability. However, `SCHOOL_CODE_REGEX` constant (if it was in-lined, the regex is gone) and `useCheckSchoolCodeAvailability` import should confirm they're fully removed.

**Recommendation:** Run `pnpm --filter academic lint` / `check-types` to ensure no stale imports remain.

---

### 7. `any` cast in error rendering

**File:** `apps/academic/src/components/auth/register-form.tsx` (lines 373, 393–394, 435–436, 455–456)

```typescript
: (field.state.meta.errors[0] as any)?.message
```

This pattern appears **four times** in `AdminStepForm` — it casts to `any` to access `.message`. The guidelines explicitly state:

> Use TypeScript for type safety. AVOID using `any`.

**Recommendation:** Use a proper type guard or helper. TanStack Form errors are typed; use the correct union type for `ValidationError` from `@tanstack/react-form`, or create a shared helper:

```typescript
// utils/form-error.ts
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}
```

---

### 8. Blank line left in `SchoolStepForm` after removal

**File:** `apps/academic/src/components/auth/register-form.tsx` (lines 264–266)

```tsx
<div className="space-y-4 rounded-lg py-4">
  {/* blank line left after removing schoolCode field */}
  
  <form.AppField name="schoolName">
```

After removing the `schoolCode` `<form.AppField>` block, there's a trailing blank line inside the `<div>`. Minor cosmetic issue, but worth cleaning up.

---

### 9. `educationLevel` default value is hardcoded

**File:** `apps/academic/src/components/auth/register-form.tsx` (line 73)

```typescript
defaultValues: {
  educationLevel: "SD",
```

Defaulting to `"SD"` could mislead users into missing that they need to consciously select a level. 

**Recommendation:** Consider defaulting to `""` (empty string) and letting Zod/validation reject an incomplete selection, or use a placeholder/prompt-only Select state.

---

## NestJS Checklist Review

| Criterion | Status | Notes |
|---|---|---|
| Controllers are thin | ✅ | Business logic in service |
| Input validation (DTOs with class-validator) | ✅ | `RegisterTenantDto` is correctly validated |
| Proper error handling | ⚠️ | See issue #3 (fragile error string matching) and #4 (empty slug guard) |
| Single-responsibility services | ✅ | OK |
| Prisma transaction for multi-step | ✅ | `$transaction` used correctly |
| No dead code / leaked endpoints | ❌ | `checkSchoolCodeAvailability` is now dead — see issue #1 |
| No `any` usage | ⚠️ | Frontend `AdminStepForm` has 4x `as any` casts |

---

## Action Items

| Priority | Issue | File |
|---|---|---|
| 🔴 Critical | Remove `checkSchoolCodeAvailability` (dead code + info leak) | `tenants.service.ts`, controller, frontend hook |
| 🔴 Critical | Guard against empty slug from non-Latin names | `tenants.service.ts` |
| 🟡 Medium | Replace error string substring match with structured error code | `register-form.tsx`, `tenants.service.ts` |
| 🟡 Medium | Show slug preview in school step form for better UX | `register-form.tsx` |
| 🔵 Minor | Remove 4x `as any` casts; use typed error helper | `register-form.tsx` |
| 🔵 Minor | Clean up trailing blank line after schoolCode removal | `register-form.tsx` |
| 🔵 Minor | Reconsider hardcoded `educationLevel: "SD"` default | `register-form.tsx` |
| 🔵 Minor | Consolidate `EDUCATION_LEVEL_VALUES` into shared package | Multiple files |
