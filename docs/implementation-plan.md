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
