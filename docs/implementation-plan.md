# Implementation Plan — Move NIS/NISN/NIP/NUPTK to Custom Fields

## Goal

Move student identifiers (NIS, NISN) and teacher identifiers (NIP, NUPTK) from fixed profile columns to optional custom fields, without soft validation or uniqueness warnings for now.

## Scope

- Database schema and migrations to remove fixed columns and uniqueness constraints.
- Backend profile APIs to stop reading/writing those columns.
- Custom field templates and field values to store identifiers.
- Frontend forms, lists, and detail views to read/write identifiers via custom fields.
- Data migration from existing columns into custom field values.

## Out of Scope (Deferred)

- Soft validation (format checks) and uniqueness warnings.
- Tenant-level enforcement toggles.

## Current State (Key References)

- Student/teacher profiles store identifiers as columns in [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma).
- Backend profile create/update/search relies on those columns in [apps/backend/src/profiles/profiles.service.ts](apps/backend/src/profiles/profiles.service.ts).
- Frontend forms and lists bind directly to those fields in:
  - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/index.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/index.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/teachers/index.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/teachers/index.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/-components/-students-form-modal.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/-components/-students-form-modal.tsx)
  - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/teachers/-components/-teachers-form-modal.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/teachers/-components/-teachers-form-modal.tsx)
- Default custom field template lives in [apps/backend/src/configurations/templates/basic.json](apps/backend/src/configurations/templates/basic.json).

## Decisions

- Identifiers are optional custom fields only.
- No uniqueness enforcement or soft validation in this iteration.
- Existing API responses will drop identifier columns; UI will read from custom field values.

## Implementation Plan

1. **Schema & Migration**
   - Remove `nis`, `nisn` from `StudentProfile`; remove `nip`, `nuptk` from `TeacherProfile` in [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma).
   - Remove unique constraints on those columns.
   - Generate a Prisma migration and client update.

2. **Seed/Template Custom Fields**
   - Add optional custom fields for student (`nis`, `nisn`) and teacher (`nip`, `nuptk`) in [apps/backend/src/configurations/templates/basic.json](apps/backend/src/configurations/templates/basic.json).
   - Ensure configuration apply logic does not break when these fields already exist.

3. **Data Migration (One-time)**
   - Write a migration script or DB task to copy existing column values into `StudentProfileFieldValue` / `TeacherProfileFieldValue` with matching `TenantProfileField` keys.
   - Ensure it is idempotent (skip when values already exist).

4. **Backend API Updates**
   - Remove identifier fields from DTOs in:
     - [apps/backend/src/profiles/dto/create-student-profile.dto.ts](apps/backend/src/profiles/dto/create-student-profile.dto.ts)
     - [apps/backend/src/profiles/dto/update-student-profile.dto.ts](apps/backend/src/profiles/dto/update-student-profile.dto.ts)
     - [apps/backend/src/profiles/dto/create-teacher-profile.dto.ts](apps/backend/src/profiles/dto/create-teacher-profile.dto.ts)
     - [apps/backend/src/profiles/dto/update-teacher-profile.dto.ts](apps/backend/src/profiles/dto/update-teacher-profile.dto.ts)
   - Remove uniqueness checks and column writes in [apps/backend/src/profiles/profiles.service.ts](apps/backend/src/profiles/profiles.service.ts).
   - Update list/search logic to remove `nis`/`nisn`/`nip`/`nuptk` filters or switch to custom-field-based searching where already supported (via configuration service filtering).
   - Update any API responses that currently expose these columns (profiles, sessions, users) to pull from custom fields if needed:
     - [apps/backend/src/sessions/sessions.service.ts](apps/backend/src/sessions/sessions.service.ts)
     - [apps/backend/src/users/users.service.ts](apps/backend/src/users/users.service.ts)
     - [apps/backend/src/configurations/configurations.service.ts](apps/backend/src/configurations/configurations.service.ts) (export/filter payloads)

5. **Frontend API Types & Queries**
   - Remove identifier fields from student/teacher API types and payloads:
     - [apps/academic/src/lib/services/api/students/students.types.ts](apps/academic/src/lib/services/api/students/students.types.ts)
     - [apps/academic/src/lib/services/api/teachers/teachers.types.ts](apps/academic/src/lib/services/api/teachers/teachers.types.ts)
   - Ensure list queries include customFieldValues (already supported for students; add for teachers if needed).

6. **Frontend UI Updates**
   - Replace identity columns to read from custom field values (using fields by key) in:
     - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/index.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/index.tsx)
     - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/teachers/index.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/teachers/index.tsx)
   - Remove NIS/NISN/NIP/NUPTK inputs from create/edit modals and rely on Custom Fields modal (or add a small custom-field inline editor if needed) in:
     - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/-components/-students-form-modal.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/-components/-students-form-modal.tsx)
     - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/students/-components/-students-edit-modal.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/students/-components/-students-edit-modal.tsx)
     - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/teachers/-components/-teachers-form-modal.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/teachers/-components/-teachers-form-modal.tsx)
     - [apps/academic/src/routes/\_authed/dashboard/\_sidenavs/admin-staff/teachers/-components/-teachers-edit-modal.tsx](apps/academic/src/routes/_authed/dashboard/_sidenavs/admin-staff/teachers/-components/-teachers-edit-modal.tsx)
   - Update any student/teacher profile cards that display identifiers to read custom field values:
     - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/student/-components/student-profile-card.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/student/-components/student-profile-card.tsx)
     - [apps/academic/src/routes/\_authed/dashboard/\_topnavs/teacher/sessions/$sessionId.tsx](apps/academic/src/routes/_authed/dashboard/_topnavs/teacher/sessions/$sessionId.tsx)

7. **Docs & Contracts**
   - Update any relevant docs that mention NIS/NISN/NIP/NUPTK as fixed fields, including [docs/custom-profile-properties.md](docs/custom-profile-properties.md) if needed.

## Testing Plan

- **Migration:** Verify columns removed and data copied into custom fields; ensure existing records retain identifier values.
- **Backend:**
  - Profile create/update no longer accepts identifier fields.
  - Listing and exports return identifiers via custom fields when present.
- **Frontend:**
  - Students/teachers list identity column displays custom-field values.
  - Create/edit flows work without identifier inputs; custom fields modal saves identifiers.
- **Regression:** Search/filter and session views still render without errors.

## Risks & Mitigations

- **Data loss risk:** Mitigate with explicit data migration and verification steps.
- **Missing fields after template update:** Add a backfill task to create identifier fields for existing tenants not using templates.
- **Search gaps:** Accept short-term reduction in search capability until custom-field search is enhanced.
# User Creation Invite Flow — Implementation Plan

## Summary of the conversation
- Agreed to replace password-based user creation with an email invite flow.
- Invite tokens expire after 72 hours.
- Resend invite allowed, rate-limited to 15 minutes.
- Duplicate emails are rejected (no merge).
- Expired invites are recoverable via resend.
- Expired, unaccepted invites are pruned (deleted), not kept for audit.
- SMTP is available; no SSO.
- Bulk imports should create invited users and send invites in batches.
- Requirement to update the Create Student and Create Teacher forms to align with invite flow.

## Requirements and scope
- **User creation** (single + bulk) should no longer accept passwords.
- **Invite flow**: generate token + expiry; send email invite; accept invite sets password and activates account.
- **Resend invite**: regenerate token + expiry; invalidate old token; enforce 15-minute cooldown.
- **Prune**: delete invited users with expired tokens.
- **Forms**: update Create Student and Create Teacher forms to remove password fields and messaging.

## Existing implementation review (to be confirmed)
- Locate current user creation endpoints and services (NestJS) handling student/teacher creation.
- Find frontend forms for student/teacher creation and their validation schemas.
- Identify any existing email service or auth flows for password setup.
- Confirm Prisma user model fields and any existing status/invite fields.

## High-level design
- **User status**: `invited` → `active`.
- **Invite token**: store hash and expiry on user (or a dedicated invite table if preferred).
- **Acceptance**: password set on accept; token cleared.
- **Resend**: rate-limited by `lastInviteSentAt` (or equivalent).
- **Prune**: scheduled job deletes expired invites.

## API surface (conceptual)
- `POST /users` (create single user, no password)
- `POST /users/bulk` (bulk create, no password)
- `POST /users/:id/invite` (resend invite)
- `POST /auth/accept-invite` (set password using token)

## Tasks
1. **Backend: Data model**
  - Add fields for invite flow: `status`, `inviteTokenHash`, `inviteExpiresAt`, `invitedAt`, `lastInviteSentAt`, `inviteSentCount`, `invitedBy` (if not present).
  - Confirm unique constraints on email to enforce reject on duplicates.

2. **Backend: Invite flow endpoints**
  - Implement create user (single/bulk) without password; set `status=invited` and create token.
  - Implement resend invite with 15-minute cooldown; regenerate token and expiry.
  - Implement accept invite endpoint to set password and activate user.

3. **Backend: Email delivery**
  - Add/extend email service to send invite links via SMTP.
  - Ensure tokens are hashed at rest; invite link includes token only.

4. **Backend: Prune job**
  - Add scheduled job to delete users with `status=invited` and `inviteExpiresAt < now()`.

5. **Frontend: Create Student form update**
  - Remove password fields and validation.
  - Update copy to explain invite email and 72-hour expiry.
  - Provide feedback for invite sent and duplicate email rejection.

6. **Frontend: Create Teacher form update**
  - Mirror student changes: remove password fields/validation.
  - Update copy and success/failure states.

7. **Frontend: Bulk import UI (if present)**
  - Ensure bulk import creates invited users only.
  - Present invalid/duplicate rows results clearly.

8. **Security & audit**
  - Rate limit resend and invite acceptance endpoints.
  - Avoid returning token in any response body.

## Open questions
- Confirm existing email templates or whether new template is needed.
- Confirm location/format of bulk import (CSV upload or server-side batch).

## Testing plan
- **Unit tests**
  - Token generation and hashing.
  - Resend cooldown logic.
  - Accept invite transitions status and clears token.
  - Reject duplicate email creation.

- **Integration tests**
  - Create invited user (single and bulk).
  - Resend invite success and rate-limited case.
  - Accept invite with valid/expired token.
  - Prune job removes expired invites.

- **Frontend tests (if applicable)**
  - Form validation removed for password fields.
  - Error states for duplicate email.
  - Success state indicates invite sent.

## Notes
- No implementation in this step; plan only.
