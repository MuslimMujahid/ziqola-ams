# Ziqola AMS — Codebase Feature Analysis

## Architecture Overview

**Monorepo** managed with **pnpm workspaces + Turborepo**.

| Layer | Stack | Location |
|---|---|---|
| Backend API | NestJS + Prisma + PostgreSQL | `apps/backend` |
| Academic Frontend | React (Vite) + TanStack Router | `apps/academic` |
| Marketing / Landing | Next.js | `apps/web` |
| Shared DB Schema | Prisma schema + generated client | `packages/db` |
| Shared UI | Component library (`@repo/ui`) | `packages/ui` |

Infrastructure: Docker Compose runs Postgres + Adminer UI.

---

## Features Implemented

### 1. 🔐 Authentication
**How it works:**
- JWT-based authentication (`AuthModule`) with Passport strategies
- Login / register endpoints in `auth.controller.ts`
- Password stored as bcrypt hashes (`passwordHash` field)
- User invite flow: `inviteTokenHash`, `inviteExpiresAt`, `inviteSentCount` tracked in DB
- Rate limiting via `ThrottlerModule` (60 req/min)
- Global RBAC guard (`RbacModule`) enforces role-based access on every route

**Roles:** `PRINCIPAL`, `ADMIN_STAFF`, `TEACHER`, `STUDENT`

---

### 2. 🏢 Multi-Tenancy
**How it works:**
- Every entity is scoped to a `Tenant` by `tenantId`
- Tenant has a `slug` (unique URL-safe identifier) and `educationLevel`
- Each tenant tracks one `activeAcademicYear` and delegates the `activePeriod` pointer to `AcademicYear`
- Application-level enforcement: tenant context is extracted from the authenticated user's JWT

---

### 3. 👥 User Management (`users/`)
**How it works:**
- CRUD for users (create, list, update, deactivate)
- User invite system: generate invite token → send email → user activates account
- `UserStatus`: `INVITED` → `ACTIVE`
- `user-invite-prune.service.ts`: scheduled job that cleans up expired/stale invites
- Unique email per tenant (`@@unique([tenantId, email])`)

---

### 4. 📅 Academic Structure (`academic/`)
**Models:** `AcademicYear` → `AcademicPeriod`

**How it works:**
- Admin creates academic years (e.g. `2025/2026`) and periods (semesters)
- One period can be marked as "active" per year via `activePeriodId` pointer
- `AcademicStatus`: `ACTIVE` / `ARCHIVED`; `PeriodStatus`: `DRAFT` / `ARCHIVED`
- Frontend (**Admin Staff sidenav**): manage years and periods with full CRUD UI

---

### 5. 🏫 Classes & Enrollment (`classes/`, `enrollments/`)
**How it works:**
- Classes are per-academic-year; unique by `(tenantId, academicYearId, name)`
- `ClassEnrollment`: time-bounded student ↔ class membership (supports mid-year transfers via `endDate`)
- `HomeroomAssignment`: assigns a teacher as homeroom teacher for a class; supports reassignment
- `ClassGroup`: tags a class with `Group` labels (GRADE, STREAM, PROGRAM, CUSTOM)
- Frontend: full class management page with enrollment management

---

### 6. 📚 Subjects & Teaching Assignments (`subjects/`, `class-subjects/`)
**How it works:**
- `Subject`: tenant-wide subject catalog (soft-delete via `isDeleted`)
- `ClassSubject`: links a subject to a class for a year, assigns a teacher, stores `kkm` (minimum competency score)
- `TeacherSubject`: global teacher–subject capability mapping used for assessment type weight configuration
- Frontend: subjects management page under Admin Staff sidenav

---

### 7. 🗓️ Scheduling (`schedules/`)
**How it works:**
- `Schedule`: recurring weekly slot (day of week, start/end time) per class-subject-period
- DB constraint prevents teacher double-booking at the same time slot: `@@unique([teacherProfileId, academicPeriodId, dayOfWeek, startTime])`
- Service includes conflict detection logic
- Frontend: schedule view for both **Teacher** and **Student** dashboards

---

### 8. 🎓 Sessions & Materials (`sessions/`)
**How it works:**
- `Session`: a concrete class meeting tied to a schedule slot (date + times)
- `SessionMaterial`: rich content (JSON rich-text, external links) uploaded by the teacher for a session
- `SessionMaterialAttachment`: file attachments on materials stored via file storage (`fileKey`, `mimeType`, `size`)
- Frontend: Teachers can manage sessions and upload materials; Students can view session content

---

### 9. ✅ Attendance (`sessions/` → `Attendance` model)
**How it works:**
- Attendance recorded per student per session: `PRESENT`, `EXCUSED`, `SICK`, `ABSENT`
- Optional `remarks` field for context
- Unique constraint: one record per `(sessionId, studentProfileId)` — prevents duplicates
- Tracked via `sessions.service.ts`

---

### 10. 📝 Assessment & Grading (`assessment-components/`, `assessment-scores/`, `assessment-recap/`)
**How it works:**
- **Assessment Types** (`TenantAssessmentType`): tenant-configurable type labels (e.g. "Daily Quiz", "Mid-Term", "Final Exam") with ordering and enable/disable toggle
- **Assessment Components** (`AssessmentComponent`): specific graded items per class-subject-period per type
- **Assessment Scores** (`AssessmentScore`): `Decimal(5,2)` score per student per component; supports locking (`isLocked`, `lockedAt`)
- **Type Weights** (`AssessmentTypeWeight`): teacher defines percentage weight per assessment type per period per subject
- **Assessment Submission** (`AssessmentSubmission`): teacher submits grades formally; workflow: `submitted` → can be returned with notes
- **Score Change Request** (`AssessmentScoreChangeRequest`): workflow for teacher to request grade correction after submission; status: `pending` → `resolved`
- **Recap** (`assessment-recap/`): large service (65 KB) that aggregates scores, applies weights, and computes final period grades for each student
- Frontend: Teacher can create assessment components, enter/edit scores, view recap. Score locking and change requests supported.

---

### 11. 📋 Report Cards (`assessment-recap/` → `ReportCard`, `ReportCardSubject`)
**How it works:**
- `ReportCard`: one per student per period; workflow: `DRAFT` → `REVIEW` → `APPROVAL` → `LOCKED`
- `ReportCardSubject`: stores `numericScore` (Decimal) + `gradeLetter` (A–F) + optional description per subject
- Compiled by a homeroom teacher (`compiledByProfileId`), approved by a principal/staff (`approvedById`)
- Frontend: **Teacher compile page** (`/compile`) for homeroom teachers to generate report cards

---

### 12. 👤 User Profiles (`profiles/`)
**How it works:**
- **TeacherProfile**: gender, date of birth, phone, hire date, additional JSON identifiers
- **StudentProfile**: gender, date of birth, phone, NIS (school ID), NISN (national ID) — unique per tenant
- **Custom Profile Fields** (`TenantProfileField`): admin can define dynamic extra fields (text, number, date, boolean, select, multi-select, file) for both student and teacher profiles
- Field values stored in `StudentProfileFieldValue` / `TeacherProfileFieldValue`
- Custom fields sourced from configurable templates (`sourceTemplateId`)

---

### 13. ⚙️ Tenant Settings & Configuration (`configurations/`)
**How it works:**
- `TenantConfiguration`: stores per-tenant configuration blocks (currently type `PROFILE`)
- Template-based: configs reference a `templateId` and track `templateHash` for update detection
- `isCustomized` flag tracks whether tenant has diverged from the template
- Frontend: **Settings > Customization** page for admin staff

---

### 14. 📦 File Uploads (`common/uploads/`)
- Shared upload module for session material attachments
- Stores `fileKey`, `fileName`, `mimeType`, `size`
- Likely uses local or S3-compatible storage (storage abstraction in `common/storage/`)

---

### 15. 🔊 Audit Logging
**How it works:**
- `AuditLog` model tracks `CREATE`, `UPDATE`, `DELETE`, `LOCK`, `APPROVE` actions
- Entity types tracked: `GRADE`, `ATTENDANCE`, `REPORT_CARD`
- Stores actor, timestamp, and free-form `metadata` JSON

---

### 16. 🖥️ Role-specific Dashboards (Frontend)
- **Admin Staff**: Overview stats (students, classes, subjects, schedules, teachers, data issues), quick actions, checklist, recent activity, alerts panel
- **Teacher**: Schedule view, session management, assessment entry, grade recap, report card compilation
- **Student**: Schedule view, session/materials browsing
- **Principal**: Dashboard with school overview (principal.tsx)

---

## Improvements & Things to Add

### 🔴 High Priority (Core Feature Gaps)

| # | What | Why |
|---|---|---|
| 1 | **Real-time Dashboard Stats** | Dashboard cards show hardcoded mock data; needs live API data queries |
| 2 | **Email Service Integration** | Invite emails stubbed; needs an actual provider (Resend, SendGrid, SMTP) |
| 3 | **Report Card PDF Export** | No PDF generation; report cards can't be printed/downloaded |
| 4 | **Attendance Analytics** | No attendance summary/report view per student or class |
| 5 | **Notification System** | No in-app or push notifications for grade submissions, report card approvals, etc. |

### 🟡 Medium Priority (UX & Workflow)

| # | What | Why |
|---|---|---|
| 6 | **Bulk Score Entry** | Teachers must enter scores one by one; a spreadsheet-style grid would save time |
| 7 | **Student Portal for Scores/Attendance** | Student dashboard shows schedule but no grades or attendance history yet |
| 8 | **Principal Approval Workflow UI** | Report card approval workflow exists in the DB but the principal's frontend page (`principal.tsx`) needs the full approval UI |
| 9 | **Schedule Conflict Visualization** | Conflict detection is in the backend; frontend needs a visual timetable/conflict indicator |
| 10 | **Mid-year student transfer UI** | `ClassEnrollment.endDate` supports transfers in the model but UX for it is unclear |

### 🟢 Nice-to-Have

| # | What | Why |
|---|---|---|
| 11 | **Parent/Guardian Role** | No parent portal for viewing child's grades/attendance |
| 12 | **Announcements / Noticeboard** | No school-wide or class-level announcement feature |
| 13 | **API Documentation (Swagger)** | NestJS supports OpenAPI natively — worth enabling for easier integration/testing |
| 14 | **Dark/Light Theme Toggle** | Frontend uses a design system with CSS variables but no explicit toggle found |
| 15 | **Audit Log Viewer (Admin UI)** | `AuditLog` model is populated but no admin page to browse/filter audit history |
| 16 | **Data Import (CSV/Excel)** | Bulk student and teacher import to speed up school setup |
| 17 | **Multi-Language Support** | UI strings already in Indonesian (id-ID); could add i18n scaffolding to support bilingual content |
| 18 | **Grading Scale Configuration** | Letter-grade cutoffs (A/B/C/D/E/F) seem hardcoded; should be tenant-configurable |
