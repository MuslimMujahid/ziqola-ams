# Implementation Plan - Profile Identifiers and Demographics Refactor

## Goal

Refactor student identifiers and user demographics as follows:

- Move NIS and NISN to StudentProfile as nullable columns with unique-per-tenant constraints.
- Remove StudentProfile.additionalIdentifiers from schema and code.
- Remove User.gender, User.dateOfBirth, and User.phoneNumber; store these as profile custom field values for students and teachers only.
- Keep TeacherProfile.additionalIdentifiers unchanged for now.

## Scope

- Database schema, migrations, and data backfill.
- Backend services, DTOs, and API response shapes for users and profiles.
- Frontend API types and UI usage for student profile data.
- Seed and migration scripts touching identifiers and profile fields.

## Out of Scope

- Admin/principal demographic fields (future work).
- Removing TeacherProfile.additionalIdentifiers.

## Current State Summary (Key Observations)

- Student identifiers (nis/nisn) are stored as TenantProfileField + StudentProfileFieldValue and used in backend services and student UI.
- StudentProfile.additionalIdentifiers is created/updated/exposed in the backend and frontend.
- User.gender, User.dateOfBirth, and User.phoneNumber are stored on User and used in create/update flows and profile responses.
- Seed and migration scripts assume identifier custom fields and additional identifiers on profiles.

## Requirements and Constraints

- NIS and NISN must be unique per tenant, nullable.
- Demographic fields are only needed for student and teacher roles for now.
- No backward compatibility required for API responses.

## Implementation Plan

### 1) Schema Changes (Prisma)

- Add StudentProfile columns:
  - nis String? and nisn String?
  - Add @@unique([tenantId, nis]) and @@unique([tenantId, nisn])
- Remove StudentProfile.additionalIdentifiers.
- Remove User.gender, User.dateOfBirth, User.phoneNumber.
- Keep TeacherProfile.additionalIdentifiers unchanged.

### 2) Data Migration Strategy

- Preflight checks:
  - Scan for duplicate nis/nisn per tenant in existing custom field values.
  - Decide whether to fail migration or resolve duplicates manually.
- Backfill StudentProfile.nis and StudentProfile.nisn from StudentProfileFieldValue (keys: nis, nisn).
- Backfill TeacherProfileFieldValue and StudentProfileFieldValue for gender, dateOfBirth, phoneNumber from User columns.
  - Confirm or add TenantProfileField definitions for these keys and ensure types are consistent.
- Optional cleanup:
  - Deprecate or disable nis/nisn profile fields after backfill to avoid divergence.

### 3) Backend Updates

- Users module:
  - Remove gender/dateOfBirth/phoneNumber from DTOs and service create/update/select payloads.
  - Adjust response shapes to no longer expose those fields on User.
- Profiles module:
  - Remove StudentProfile.additionalIdentifiers from create/update/find methods and selects.
  - Add nis/nisn to StudentProfile select/response as needed.
  - Ensure TeacherProfile remains unchanged except for removal of user demographic fields.
- Sessions service:
  - Replace lookup of nis/nisn via profile field values with StudentProfile.nis/nisn.
- Assessment recap service:
  - Replace nis lookups via profile field values with StudentProfile.nis.
- Profile custom fields:
  - Ensure endpoints can create/update field values for gender, dateOfBirth, phoneNumber for both students and teachers.

### 4) Frontend Updates (Academic App)

- Update API types:
  - Remove gender/dateOfBirth/phoneNumber from user types.
  - Remove StudentProfile.additionalIdentifiers from student types.
  - Add nis/nisn to student profile types as required by UI.
- Update data usage:
  - Student top nav/profile card should use StudentProfile.nis from profile endpoints instead of custom fields.
  - Teacher profile UI should no longer rely on user demographics; use profile field values if required.

### 5) Seed and Migration Tooling

- Update seed CSV headers and payload mapping to remove user demographics and student additional identifiers.
- Update seed logic to populate StudentProfile.nis/nisn directly.
- Update or replace migrate-profile-identifiers script:
  - New direction: migrate nis/nisn from custom fields into StudentProfile columns.
  - Ensure script is idempotent and logs duplicates.

### 6) Validation and Cleanup

- Remove unused fields from API responses and client types.
- Delete or disable unused TenantProfileField entries for nis/nisn if desired.
- Verify no remaining references to StudentProfile.additionalIdentifiers or User demographics.

## Testing Plan

- Database migration:
  - Verify migration runs with existing data.
  - Validate unique constraints for nis/nisn with NULLs allowed.
- Backend API:
  - Users list, get, update, invite flows no longer include demographics.
  - Student and teacher profile endpoints return expected data.
  - Sessions attendance and assessment recap still include student identifiers.
- Frontend:
  - Student dashboard profile card shows NIS from StudentProfile.
  - User management and profile screens work without demographics on User.
- Seed and scripts:
  - Seed completes without missing columns.
  - Migration script correctly backfills nis/nisn and demographics field values.

## Risks and Open Questions

- Duplicate nis/nisn values per tenant can block migration due to unique constraints.
- Confirm final key names and types for gender, dateOfBirth, phoneNumber in TenantProfileField.
- Decide whether to keep nis/nisn custom fields for legacy display or disable them post-migration.
