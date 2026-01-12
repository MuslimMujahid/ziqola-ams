# Implementation Plan — Academic Auth Pages

## Goal

Plan and scope the authentication pages for the Academic app (TanStack Start). Focus on user sign-in (tenant-scoped), session handling, and protected route access.

## Scope (MVP)

- Sign-in page (tenant code/slug + email + password).
- Logout flow (clear session and redirect).
- Auth layout for public auth routes.
- Protected route gate for authenticated pages.
- API client integration for `/auth/login`, `/auth/me`, `/auth/logout`.

## Out of Scope (for now)

- Forgot/reset password (no backend endpoint present).
- Public self-registration (register endpoint is protected for roles).
- SSO, MFA, or social login.

## Assumptions & Dependencies

- Backend endpoints available:
  - `POST /auth/login` (requires `tenantSlug`, `email`, `password`).
  - `GET /auth/me` (requires access token).
  - `POST /auth/logout` (stateless but available).
- Auth store exists at [apps/academic/src/stores/auth.store.ts](apps/academic/src/stores/auth.store.ts).
- Axios client exists at [apps/academic/src/lib/services/api/api.ts](apps/academic/src/lib/services/api/api.ts).

## Backend Readiness Assessment (Current)

- **Sufficient for basic login flow** if tenant UUID is known:
  - `/auth/login` returns user + access token.
  - `/auth/me` returns minimal user payload.
  - `/auth/logout` returns success (no token revocation).
- **Gaps for improved tenant UX** (non-UUID): no endpoint or data model for tenant slug/code or tenant lookup by name/email.
- **Potential data gap**: `/auth/me` omits `name` and other user fields returned during login.
- **Token lifecycle**: no refresh token or revoke mechanism; acceptable for MVP but should be documented.

## UX & Content Requirements

- UI language: Indonesian labels and helper text.
- Clean, minimalist layout per design guidelines.
- Form validation with clear inline errors and `role="alert"` for server error.
- Accessibility: proper `label`/`input` associations, focus states, keyboard navigation.
- Tenant identification should avoid raw UUIDs; prefer human-friendly tenant discovery.

## Planned Routes & UI Structure

- Public auth routes under `apps/academic/src/routes/auth/`:
  - `login.tsx` (Sign-in page).
  - `_layout.tsx` (Auth layout with centered card, logo, and help text).
- Protected application layout under `apps/academic/src/routes/(app)/` or existing root:
  - Add auth guard at layout or route-level.

## Data & State Flow

- On submit (login):
  - Call `POST /auth/login` via Axios API service.
  - Store access token and user details in `useAuthStore`.
  - Redirect to default landing route (e.g., dashboard).
- On app load (protected routes):
  - If token exists but user missing, call `GET /auth/me` to hydrate.
  - If unauthorized, clear session and redirect to login.
- On logout:
  - Call `POST /auth/logout` (optional) then clear session and redirect.

## Files to Add or Update (Planned)

### API Layer (Academic)

- Add auth API domain:
  - `apps/academic/src/lib/services/api/auth/api.auth.ts`
  - `apps/academic/src/lib/services/api/auth/types.ts`
- Add React Query hooks:
  - `apps/academic/src/lib/hooks/auth/use-login.ts`
  - `apps/academic/src/lib/hooks/auth/use-me.ts`
  - `apps/academic/src/lib/hooks/auth/use-logout.ts`

### UI Components

- Auth form component:
  - `apps/academic/src/components/auth/login-form.tsx`
- Optional shared auth layout container:
  - `apps/academic/src/components/auth/auth-card.tsx`

### Routes

- Auth layout route:
  - `apps/academic/src/routes/auth/_layout.tsx`
- Login page:
  - `apps/academic/src/routes/auth/login.tsx`
- Protected app layout (if not present):
  - `apps/academic/src/routes/(app)/_layout.tsx` with auth guard

## Detailed Task Breakdown

1. **Define auth API types and service**
   - Create `LoginRequest` and `LoginResponse` types matching backend DTOs.
   - Implement `login`, `me`, and `logout` functions using Axios client.

2. **Implement auth React Query hooks**
   - `useLogin` mutation with invalidation of `me` query.
   - `useMe` query to hydrate session and user state.
   - `useLogout` mutation to clear store and redirect.

3. **Build login form with TanStack Form + Zod**

- Fields: `tenantSlug`, `email`, `password`.
- Zod validation: required fields, email format, password min 8.
- Show inline errors and server error banner.

4. **Create auth layout and route structure**
   - Add `auth/_layout.tsx` for consistent auth page wrapper.
   - Add `auth/login.tsx` with error and pending boundaries.

5. **Implement route protection**
   - Add auth guard in protected layout or per-route `beforeLoad`.
   - Redirect unauthenticated users to login.
   - Ensure hydrated state prevents flicker (use `hydrated` flag from store).

6. **Wire logout handling**
   - Provide a logout handler in app layout or user menu.
   - Clear session and redirect to login.

## Testing Plan

- **Unit/Component**:
  - Login form validation errors (required fields, invalid email).
  - Submit button disabled during submission.
- **Integration**:
  - Successful login stores token and redirects.
  - Failed login shows server error and does not navigate.
  - Auth guard redirects to login when unauthenticated.
  - `GET /auth/me` hydrates user when token exists.
- **Manual QA**:
  - Accessibility checks with keyboard-only navigation.
  - Responsive layout on mobile and desktop.

## Open Questions

Resolved:

- Post-login landing route: **Dashboard**.
- Tenant identification: **Tenant code/slug**.
- Branding:
  - Logo: **Ziqola** (text-only).
  - App name: **Ziqola**.
  - Tagline: **Solusi Cerdas untuk Sekolah Modern**.

## Tenant Identification UX Options (Non-UUID)

1. **Tenant code/slug**

- Use short, human-friendly codes (e.g., `sma-1-bdg`) created by admin.
- Pros: Simple, memorable, supports typed input.
- Cons: Requires uniqueness and discovery strategy.

2. **Subdomain-based login**

- Each tenant uses `tenant.zql.academy` or `tenant.ziqola.id`.
- Login page can omit tenant field; tenant inferred from host.
- Pros: No tenant field, clean UX.
- Cons: Requires DNS + SSL management and deployment support.

3. **Institution lookup with name search**

- Field: “Nama sekolah” with autocomplete + pick list.
- Backend endpoint: search tenants by name; returns `tenantId`.
- Pros: Friendly, discoverable.
- Cons: Needs fuzzy search, rate limiting, and disambiguation.

4. **Email-first flow (tenant discovery)**

- User enters email → system finds tenant mapping → then password.
- Pros: Reduces fields, matches typical SaaS UX.
- Cons: Requires user-email-to-tenant mapping and anti-enumeration measures.

5. **Invite link / QR code**

- Provide tenant-specific invite URL/QR (e.g., shared by admin).
- Pros: Great for onboarding, avoids typing.
- Cons: Not ideal for daily login unless remembered link.

## Recommended Direction (for MVP)

- Use **tenant code/slug** as primary input, with help text and example format.
- Optionally add **institution lookup** if tenant count is large or users struggle.
- Keep UUIDs internal only; never show raw UUID in UI.

## Backend Updates Needed (If Tenant UX Changes)

1. **Tenant code/slug support**

- Add `slug` (unique, human-friendly) to Tenant model.
- Add index/constraint for uniqueness.
- Update login to accept `tenantSlug` or resolve `tenantId` from slug.

2. **Tenant lookup endpoint (optional)**

- `GET /tenants/lookup?query=` returning id/slug/name for autocomplete.
- Add rate limiting and minimal payload to avoid enumeration.

3. **Email-first discovery (optional)**

- `POST /auth/identify` with email → returns masked tenant candidates.
- Add anti-enumeration response patterns (uniform responses).

4. **Enhance `/auth/me` payload**

- Include `id`, `name`, and `tenantId` (already in JWT) for UI display.
- Ensure role is included and consistent with login response.

## Acceptance Criteria

- Users can log in using tenant code/slug, email, and password.
- Authenticated session persists across refresh.
- Unauthenticated users are redirected to login for protected pages.
- UX is in Indonesian and follows design guidelines.
