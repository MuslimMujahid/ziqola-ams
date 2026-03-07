# Tasks

**Product:** Academic Management System (Multi-Tenant SaaS)  
**Based on:** `docs/functional-requirement-reviewed.md`  
**Updated:** 2026-03-07  
**Note:** Tasks are written as if the project is starting from scratch. Each task is the smallest independently deliverable unit of work.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[/]` | In progress |
| `[x]` | Done |
| `⚠️` | Blocked — requires a design/product decision first |

---

## Module 1 — Tenant Registration & Onboarding

### 1.1 — Infrastructure & Auth Foundation

- [ ] Set up PostgreSQL database with multi-tenant schema (`tenantId` on all entities)
- [ ] Create `Tenant` model: `id`, `name`, `slug`, `educationLevel`, `status`, `createdAt`
- [ ] Create `User` model: `id`, `tenantId`, `fullName`, `email`, `passwordHash`, `role`, `status`, `createdAt`
- [ ] Implement bcrypt password hashing on user creation
- [ ] Implement JWT token generation on login
- [ ] Implement JWT guard middleware (validates and extracts `userId`, `tenantId`, `role` from token)
- [ ] Implement global RBAC guard (enforce role on every protected endpoint)
- [ ] Enforce global email uniqueness across all tenants (`@unique` on `User.email`)

### 1.2 — Tenant Registration API

- [ ] `POST /auth/register` — create tenant + first Admin Staff user in a single transaction
  - [ ] Accept: `namaSekolah`, `jenjang`, `fullName`, `email`, `password`
  - [ ] Auto-generate unique `slug` from `namaSekolah` (slugify + collision suffix, e.g. `sma-negeri-1`, `sma-negeri-1-2`)
  - [ ] Validate `jenjang` against enum: SD / SMP / SMA / SMK / Lainnya
  - [ ] Validate email is globally unique
  - [ ] Create `Tenant` record with status `ACTIVE`
  - [ ] Create `User` record with role `ADMIN_STAFF` and status `ACTIVE`
  - [ ] Return JWT token on success
- [ ] `GET /auth/check-email?email=` — check if email is already registered (used during registration form)

### 1.3 — Tenant Registration Page (Frontend)

- [ ] Build public registration page `/register`
  - [ ] Form fields: Nama Sekolah, Jenjang (dropdown), Full Name, Email, Password, Confirm Password
  - [ ] Real-time email availability check (debounced API call on email field blur)
  - [ ] Inline feedback: "Email sudah terdaftar" if taken
  - [ ] Client-side validation: required fields, password match, minimum password length
  - [ ] Submit calls `POST /auth/register`
  - [ ] On success: store JWT, redirect to onboarding page

### 1.4 — Login API

- [ ] `POST /auth/login` — authenticate user by email + password
  - [ ] Resolve tenant and role from email (no school code or role input required)
  - [ ] Validate password against bcrypt hash
  - [ ] Return JWT containing `userId`, `tenantId`, `role`
  - [ ] Return 401 if email not found or password invalid

### 1.5 — Login Page (Frontend)

- [ ] Build public login page `/login`
  - [ ] Form fields: Email, Password only (no school code, no role selector)
  - [ ] Submit calls `POST /auth/login`
  - [ ] On success: store JWT, redirect to role-appropriate dashboard
  - [ ] Show inline error on invalid credentials

### 1.6 — First Login Onboarding

- [ ] Build onboarding page `/onboarding` (accessible to `ADMIN_STAFF` only)
  - [ ] Shown only when tenant has no Active Academic Year
  - [ ] Step 1: prompt to create first Tahun Ajaran (Academic Year)
  - [ ] Step 2: prompt to create first Academic Period within that year
  - [ ] On completion: redirect to Admin Staff dashboard
- [ ] Backend: detect "no academic year" state and return it in auth/profile response so frontend can redirect appropriately

---

## Module 2 — User Management

### 2.1 — User Model & Profiles

- [ ] Create `TeacherProfile` model: `id`, `userId`, `tenantId`, `nip`, `nuptk`, `hireDate`, `gender`, `dateOfBirth`, `phone`
- [ ] Create `StudentProfile` model: `id`, `userId`, `tenantId`, `nis`, `nisn`, `gender`, `dateOfBirth`, `phone`
- [ ] Enforce: academic identifiers (NIP, NIS, NISN, NUPTK) stored only in profile models, not on `User`

### 2.2 — User Management API (Admin Staff)

- [ ] `GET /users` — list all users in tenant (paginated, filterable by role/status)
- [ ] `GET /users/:id` — get single user with profile
- [ ] `POST /users` — create user with role assignment
  - [ ] Validate email is globally unique
  - [ ] Create role-specific profile (`TeacherProfile` or `StudentProfile`) if applicable
- [ ] `PATCH /users/:id` — update base user attributes (fullName, gender, dateOfBirth, phone)
- [ ] `PATCH /users/:id/deactivate` — deactivate user account
- [ ] `PATCH /users/:id/reactivate` — reactivate user account

### 2.3 — Teacher Profile API

- [ ] `GET /users/:id/teacher-profile` — get teacher profile
- [ ] `PATCH /users/:id/teacher-profile` — update teacher profile (NIP, NUPTK, hireDate, etc.)

### 2.4 — Student Profile API

- [ ] `GET /users/:id/student-profile` — get student profile
- [ ] `PATCH /users/:id/student-profile` — update student profile (NIS, NISN, etc.)

### 2.5 — User Management Pages (Frontend — Admin Staff)

- [ ] User list page `/users`
  - [ ] Table: name, email, role, status
  - [ ] Filter by role, filter by status
  - [ ] Paginated
  - [ ] "Add User" button → opens create user form
- [ ] Create user form (modal or page)
  - [ ] Fields: Full Name, Email, Role
  - [ ] On submit calls `POST /users`
- [ ] User detail / edit page `/users/:id`
  - [ ] View + edit base user fields
  - [ ] View + edit role-specific profile fields
  - [ ] Deactivate / Reactivate button

### 2.6 — Email Invite Flow

> ⚠️ **Requires decision**: The exact user creation flow (FR-02.4) is TBD. Tasks below assume an invite-based flow. If direct creation is chosen instead, adjust accordingly.

- [ ] Integrate email service provider (Resend / SendGrid / SMTP)
  - [ ] Set up provider credentials in environment config
  - [ ] Build reusable `EmailService` with `send(to, subject, html)` method
- [ ] `POST /users/:id/invite` — send invite email to user
  - [ ] Generate secure invite token, store hash + expiry in DB
  - [ ] Send invite email with activation link
- [ ] `POST /auth/activate` — activate account from invite token
  - [ ] Validate token is valid + not expired
  - [ ] Set password, set user status to `ACTIVE`
- [ ] Activation page `/activate?token=` (Frontend)
  - [ ] Form: new password + confirm password
  - [ ] On success: redirect to login
- [ ] Scheduled job: prune expired/stale invite tokens nightly

---

## Module 3 — Custom Profile Properties

> ⚠️ **Design Review Required**: The current approach (fully dynamic custom fields) may be replaced with a simpler fixed-field + per-tenant enable/disable model. All tasks below reflect the current FR spec. **Confirm approach before starting Module 3.**

### 3.1 — Data Model

- [ ] Create `ProfileFieldDefinition` model: `id`, `tenantId`, `targetType` (STUDENT/TEACHER), `key`, `label`, `fieldType`, `validationRules` (JSON), `isRequired`, `isEnabled`, `order`, `sourceTemplateId`
- [ ] Create `StudentProfileFieldValue` model: `id`, `studentProfileId`, `fieldDefinitionId`, `value` (JSON), `tenantId`
- [ ] Create `TeacherProfileFieldValue` model: `id`, `teacherProfileId`, `fieldDefinitionId`, `value` (JSON), `tenantId`
- [ ] Create `ProfileFieldTemplate` model: `id`, `version`, `targetType`, `fields` (JSON), `createdAt`

### 3.2 — Profile Field Definition API (Admin Staff)

- [ ] `GET /profile-fields?type=STUDENT|TEACHER` — list all field definitions for tenant
- [ ] `POST /profile-fields` — create new custom field definition
  - [ ] Validate `fieldType` against allowed types: TEXT, NUMBER, DATE, BOOLEAN, SELECT, MULTI_SELECT, FILE
  - [ ] Validate `validationRules` schema
- [ ] `PATCH /profile-fields/:id` — edit field definition (label, validation, required, order)
- [ ] `PATCH /profile-fields/:id/disable` — disable a field (hide but retain values)
- [ ] `PATCH /profile-fields/:id/enable` — re-enable a field

### 3.3 — Global Template API

- [ ] `GET /profile-field-templates` — list available global templates (Student / Teacher)
- [ ] `POST /profile-field-templates/:id/apply` — apply template to tenant (non-destructive, creates field definitions from template)

### 3.4 — Profile Field Value API

- [ ] `GET /users/:id/custom-fields` — get all custom field values for a user
- [ ] `PUT /users/:id/custom-fields` — upsert all custom field values for a user (bulk save)
- [ ] File upload endpoint for FILE-type field values (MinIO, max 5 MB, validate MIME type)

### 3.5 — Filter & Export API

- [ ] `GET /students?filter[fieldKey]=value` — filter students by custom field value
- [ ] `GET /teachers?filter[fieldKey]=value` — filter teachers by custom field value
- [ ] `GET /students/export` — export student list with custom field values (CSV)

### 3.6 — Custom Fields Settings Page (Frontend — Admin Staff)

- [ ] Custom fields settings page `/settings/custom-fields`
  - [ ] Toggle between Student / Teacher view
  - [ ] List existing field definitions (drag to reorder)
  - [ ] Enable / disable toggle per field
  - [ ] "Add Field" button → opens create field form
  - [ ] "Apply Template" button → shows template picker modal
- [ ] Create / edit field form
  - [ ] Fields: Label, Type, Required, Validation rules (conditional per type)
- [ ] Custom field values rendered on user profile edit page under existing Module 2.5

---

## Module 4 — Academic Structure

### 4.1 — Tahun Ajaran (Academic Year)

**Data Model**
- [ ] Create `AcademicYear` model: `id`, `tenantId`, `name`, `startDate`, `endDate`, `status` (DRAFT/ACTIVE/ARCHIVED), `activePeriodId`, `createdAt`
- [ ] Add `activeAcademicYearId` pointer to `Tenant` model

**API**
- [ ] `GET /academic-years` — list all academic years for tenant
- [ ] `GET /academic-years/:id` — get single academic year with periods
- [ ] `POST /academic-years` — create new academic year
  - [ ] Validate: date range does not overlap any existing academic year (including archived)
  - [ ] Validate: if an active year exists, new year start date must be after the last period of the active year ends
  - [ ] Create with status `DRAFT`
- [ ] `PATCH /academic-years/:id` — edit name, start date, end date (only when DRAFT)
- [ ] `PATCH /academic-years/:id/activate` — set status to ACTIVE; unset previous active year if any
- [ ] `PATCH /academic-years/:id/archive` — set status to ARCHIVED

**Frontend — Admin Staff**
- [ ] Academic year list page `/academic-years`
  - [ ] Table: name, date range, status, active badge
  - [ ] "Create Tahun Ajaran" button
  - [ ] Archive action per row
- [ ] Create academic year form (modal)
  - [ ] Fields: name (e.g. 2025/2026), start date, end date
  - [ ] Inline overlap validation feedback
- [ ] Edit academic year form (modal, DRAFT only)
- [ ] Academic year detail page `/academic-years/:id`
  - [ ] Shows academic year info + list of periods
  - [ ] "Activate" button (if DRAFT)

### 4.2 — Academic Periods

**Data Model**
- [ ] Create `AcademicPeriod` model: `id`, `tenantId`, `academicYearId`, `name`, `startDate`, `endDate`, `status` (DRAFT/ACTIVE/ARCHIVED), `createdAt`

**API**
- [ ] `GET /academic-years/:yearId/periods` — list all periods for a year
- [ ] `GET /academic-years/:yearId/periods/:id` — get single period
- [ ] `POST /academic-years/:yearId/periods` — create new period
  - [ ] Validate: date range does not overlap other periods in same year (including archived)
  - [ ] Validate: start date is after previous period's end date
  - [ ] Create with status `DRAFT`
- [ ] `PATCH /academic-years/:yearId/periods/:id` — edit name, start date, end date (DRAFT only)
- [ ] `PATCH /academic-years/:yearId/periods/:id/activate` — set to ACTIVE; unset previous active period
- [ ] `PATCH /academic-years/:yearId/periods/:id/archive` — archive period

**Frontend — Admin Staff**
- [ ] Academic period list within academic year detail page
  - [ ] Table: name, date range, status
  - [ ] "Add Period" button
  - [ ] Activate / Archive action per row
- [ ] Create period form (modal)
  - [ ] Fields: name (e.g. Semester 1), start date, end date
  - [ ] Inline overlap validation feedback
- [ ] Edit period form (modal, DRAFT only)

### 4.3 — Kelas (Class)

> ⚠️ **Design Review Pending**: Kelas model may need alignment with K-12 curriculum. Proceed with current flexible model.

**Data Model**
- [ ] Create `Class` model: `id`, `tenantId`, `academicYearId`, `name`, `gradeGroupId` (nullable), `createdAt`
- [ ] Unique constraint: `(tenantId, academicYearId, name)`

**API**
- [ ] `GET /classes?academicYearId=` — list all classes for a given academic year
- [ ] `GET /classes/:id` — get single class with homeroom + group assignments
- [ ] `POST /classes` — create new class
  - [ ] Validate name uniqueness per tenant + year
  - [ ] Optionally assign GRADE group on creation
- [ ] `PATCH /classes/:id` — edit class name
- [ ] `DELETE /classes/:id` — delete class (only if no enrollments or subjects assigned)

**Frontend — Admin Staff**
- [ ] Class list page `/classes?year=:academicYearId`
  - [ ] Filter by Academic Year (defaults to active year)
  - [ ] Table: name, grade group, homeroom teacher, student count
  - [ ] "Add Class" button
  - [ ] Delete action per row
- [ ] Create class form (modal)
  - [ ] Fields: name, optional grade (select from GRADE groups), optional label
- [ ] Edit class form (modal)
- [ ] Class detail page `/classes/:id`
  - [ ] Shows class info, homeroom teacher, groups, enrolled students

### 4.4 — Wali Kelas (Homeroom Teacher) Assignment

**Data Model**
- [ ] Create `HomeroomAssignment` model: `id`, `tenantId`, `classId`, `teacherProfileId`, `academicYearId`, `startDate`, `endDate` (nullable)
- [ ] Unique constraint: `(classId, academicYearId)` — one Wali Kelas per class per year

**API**
- [ ] `GET /classes/:id/homeroom` — get current homeroom teacher assignment
- [ ] `POST /classes/:id/homeroom` — assign homeroom teacher
  - [ ] Validate teacher has `TEACHER` role
  - [ ] Validate class does not already have a homeroom for that year
- [ ] `PATCH /classes/:id/homeroom` — reassign homeroom teacher (ends previous, creates new)
- [ ] `DELETE /classes/:id/homeroom` — remove homeroom assignment

**Frontend — Admin Staff**
- [ ] Homeroom assignment section on class detail page
  - [ ] Shows current Wali Kelas name
  - [ ] "Assign Wali Kelas" button (teacher search/select dropdown)
  - [ ] "Remove" link

### 4.5 — Rombongan Belajar (Class Group)

> ⚠️ **Design Review Pending**: May need alignment with K-12 curriculum.

**Data Model**
- [ ] Create `Group` model: `id`, `tenantId`, `name`, `type` (GRADE/STREAM/PROGRAM/CUSTOM), `createdAt`
- [ ] Create `ClassGroup` model: `id`, `classId`, `groupId`, `tenantId`
- [ ] Unique constraint: no two GRADE groups per class; no two non-GRADE groups per class
- [ ] Seed GRADE groups from Jenjang on tenant creation (e.g., SD: 1–6, SMP: 7–9, SMA/SMK: 10–12)

**API**
- [ ] `GET /groups?type=` — list all groups for tenant (filter by type)
- [ ] `POST /groups` — create new group (STREAM / PROGRAM / CUSTOM only)
  - [ ] Validate type is not GRADE (GRADE is system-managed)
- [ ] `PATCH /groups/:id` — edit group name
- [ ] `DELETE /groups/:id` — delete group (only if not assigned to any class)
- [ ] `POST /classes/:id/groups` — assign group to class
  - [ ] Validate 2-group constraint
- [ ] `DELETE /classes/:id/groups/:groupId` — remove group from class

**Frontend — Admin Staff**
- [ ] Group management page `/groups`
  - [ ] Tabs: STREAM / PROGRAM / CUSTOM (GRADE not shown)
  - [ ] List with create, edit, delete per group
- [ ] Group assignment section on class detail page
  - [ ] Shows assigned groups
  - [ ] "Assign Group" button (dropdown filtered by type, respects constraints)
  - [ ] Remove per assigned group

### 4.6 — Student Enrollment

**Data Model**
- [ ] Create `ClassEnrollment` model: `id`, `tenantId`, `classId`, `studentProfileId`, `startDate`, `endDate` (nullable), `createdAt`
- [ ] Unique constraint: one active enrollment per student per academic year at a time

**API**
- [ ] `GET /classes/:id/enrollments` — list all current enrollments for a class
- [ ] `GET /students/:id/enrollments` — list enrollment history for a student
- [ ] `POST /classes/:id/enrollments` — enroll student in class
  - [ ] Validate student belongs to same tenant
  - [ ] Validate student is not already actively enrolled in another class for the same year
- [ ] `PATCH /enrollments/:id/transfer` — mid-year transfer: set `endDate` on current + create new enrollment in target class
- [ ] `DELETE /enrollments/:id` — remove enrollent (only if no attendance/scores recorded)

**Frontend — Admin Staff**
- [ ] Student enrollment list on class detail page
  - [ ] Table: student name, NIS, enrollment date
  - [ ] "Enroll Student" button → student search modal
  - [ ] "Transfer" action → pick target class
  - [ ] "Remove" action
- [ ] Student enrollment history on student profile page
  - [ ] Timeline of classes with dates

---

## Module 5 — Mata Pelajaran & Teaching Assignments

### 5.1 — Mata Pelajaran (Subject)

**Data Model**
- [ ] Create `Subject` model: `id`, `tenantId`, `name`, `isDeleted`, `createdAt`
- [ ] Unique constraint: `(tenantId, name)` excluding soft-deleted

**API**
- [ ] `GET /subjects` — list all active subjects for tenant
- [ ] `GET /subjects/:id` — get single subject
- [ ] `POST /subjects` — create subject
  - [ ] Validate name uniqueness per tenant
- [ ] `PATCH /subjects/:id` — edit subject name
- [ ] `DELETE /subjects/:id` — soft-delete subject (only if not assigned to any active class-subject)

**Frontend — Admin Staff**
- [ ] Subject list page `/subjects`
  - [ ] Table: name, number of assigned classes
  - [ ] "Add Subject" button
  - [ ] Edit (inline or modal) per row
  - [ ] Delete per row
- [ ] Create subject form (modal): name field
- [ ] Edit subject form (modal): name field

### 5.2 — Teaching Assignment (Class Subject)

**Data Model**
- [ ] Create `ClassSubject` model: `id`, `tenantId`, `classId`, `subjectId`, `teacherProfileId`, `academicYearId`, `kkm`, `createdAt`
- [ ] Unique constraint: `(classId, subjectId, academicYearId)`

**API**
- [ ] `GET /classes/:id/subjects` — list all class-subjects for a class
- [ ] `POST /classes/:id/subjects` — assign subject + teacher to class
  - [ ] Validate one teacher per class-subject
  - [ ] Validate teacher has TEACHER role
- [ ] `PATCH /classes/:id/subjects/:id` — change assigned teacher or update KKM
- [ ] `DELETE /classes/:id/subjects/:id` — remove assignment (only if no assessment components defined)

**Frontend — Admin Staff**
- [ ] Class subject assignment section on class detail page
  - [ ] Table: subject name, assigned teacher
  - [ ] "Assign Subject" button → subject + teacher picker
  - [ ] Edit (swap teacher) per row
  - [ ] Remove per row

### 5.3 — Assessment Weights (per ClassSubject + Period)

**Data Model**
- [ ] Create `AssessmentTypeWeight` model: `id`, `classSubjectId`, `academicPeriodId`, `assessmentTypeId`, `weight` (Decimal), `tenantId`
- [ ] Enforce total weight = 100% per `(classSubjectId, academicPeriodId)` at service layer

**API**
- [ ] `GET /class-subjects/:id/weights?periodId=` — get all weights for a class-subject + period
- [ ] `PUT /class-subjects/:id/weights?periodId=` — bulk set weights for a class-subject + period
  - [ ] Validate total = 100%
  - [ ] Reject if any scores have been entered (weights are locked)

**Frontend — Teacher**
- [ ] Weight configuration page per class-subject per period
  - [ ] List of assessment types with weight % input
  - [ ] Running total indicator (must reach 100%)
  - [ ] Save button (disabled if total ≠ 100%)
  - [ ] Show "locked" state if grading has started

---

## Module 6 — Scheduling

> ⚠️ **Architecture Decision Required**: FR notes suggest replacing the current fixed weekly schedule + nightly session auto-generation with a **generic event model** (recurring / non-recurring, all-day or timed). Tasks below cover the current weekly schedule approach. **Confirm direction before starting Module 6.**

### 6.1 — Schedule (Weekly Slots)

**Data Model**
- [ ] Create `Schedule` model: `id`, `tenantId`, `classSubjectId`, `academicPeriodId`, `dayOfWeek`, `startTime`, `endTime`, `createdAt`
- [ ] Unique constraint: `(teacherProfileId, academicPeriodId, dayOfWeek, startTime)` — prevent teacher double-booking

**API**
- [ ] `GET /schedules?classId=&periodId=` — get schedule for a class in a period
- [ ] `GET /schedules/teacher?periodId=` — get schedule for the authenticated teacher
- [ ] `POST /schedules` — create schedule slot
  - [ ] Validate: teacher not already scheduled at same day + time in same period
  - [ ] Return conflict details if blocked
- [ ] `PATCH /schedules/:id` — edit day/time of schedule slot
  - [ ] Re-validate conflict on edit
- [ ] `DELETE /schedules/:id` — delete schedule slot

**Frontend — Admin Staff**
- [ ] Schedule management page per class per period `/classes/:id/schedule`
  - [ ] Weekly timetable grid (rows = time slots, cols = Mon–Sat)
  - [ ] Each cell shows subject + teacher name if scheduled
  - [ ] Click empty cell → "Add Slot" form
  - [ ] Click existing slot → edit or delete
  - [ ] Visual conflict indicator (red highlight) if backend returns conflict
- [ ] Teacher conflict warning panel — list of detected conflicts across all classes

**Frontend — Teacher**
- [ ] My schedule view `/schedule` — read-only weekly timetable for authenticated teacher

**Frontend — Student**
- [ ] My schedule view `/schedule` — read-only weekly timetable for authenticated student (filtered to their enrolled class)

### 6.2 — Sessions

**Data Model**
- [ ] Create `Session` model: `id`, `tenantId`, `scheduleId`, `classSubjectId`, `academicPeriodId`, `date`, `startTime`, `endTime`, `startedByTeacherId`, `createdAt`
- [ ] Unique constraint: `(scheduleId, date)` — one session per slot per date

**API**
- [ ] `GET /sessions?classSubjectId=&periodId=` — list sessions for a class-subject
- [ ] `GET /sessions?date=&classId=` — list sessions for a given date and class
- [ ] `POST /sessions` — create session manually (Admin Staff)
  - [ ] Accept: `scheduleId`, `date`, override start/end time optional
  - [ ] Validate no duplicate for `(scheduleId, date)`
- [ ] `POST /sessions/start` — teacher starts session from schedule
  - [ ] Derive `classSubjectId`, `academicPeriodId` from `scheduleId`
  - [ ] Validate no duplicate for that date
- [ ] `PATCH /sessions/:id` — Admin Staff edit session (date, time)
- [ ] `DELETE /sessions/:id` — Admin Staff delete session (only if no attendance recorded)

**Frontend — Admin Staff**
- [ ] Session list per class-subject (accessible from class detail)
  - [ ] Table: date, subject, teacher, attendance status
  - [ ] "Add Session" button → form (schedule slot picker, date)
  - [ ] Delete per row

**Frontend — Teacher**
- [ ] "Start Session" button on schedule view per slot
  - [ ] Derives from schedule, creates session, redirects to attendance entry

---

## Module 7 — Attendance

### 7.1 — Attendance Recording

**Data Model**
- [ ] Create `Attendance` model: `id`, `tenantId`, `sessionId`, `studentProfileId`, `status` (PRESENT/EXCUSED/SICK/ABSENT), `remarks` (nullable), `recordedAt`
- [ ] Unique constraint: `(sessionId, studentProfileId)`

**API**
- [ ] `GET /sessions/:id/attendance` — get attendance list for a session (returns all enrolled students with status)
- [ ] `PUT /sessions/:id/attendance` — bulk save attendance for a session
  - [ ] Accept array of `{ studentProfileId, status, remarks }`
  - [ ] Upsert all records in a transaction
  - [ ] Only teacher assigned to that class-subject (or Admin Staff) may submit

**Frontend — Teacher**
- [ ] Attendance entry page `/sessions/:id/attendance`
  - [ ] List of enrolled students (name, NIS)
  - [ ] Status selector per student: Hadir / Izin / Sakit / Alpha
  - [ ] Optional remarks input per student
  - [ ] "Save" button — bulk upsert
  - [ ] Pre-fill existing statuses if attendance already recorded

### 7.2 — Attendance Summary & Analytics

**API**
- [ ] `GET /students/:id/attendance-summary?periodId=` — summary for one student in a period
  - [ ] Return counts: Hadir, Izin, Sakit, Alpha, total sessions
  - [ ] Return percentage per status
- [ ] `GET /classes/:id/attendance-summary?periodId=` — summary per student for entire class in a period
- [ ] `GET /classes/:id/attendance?periodId=&subjectId=` — full attendance grid (students × sessions)

**Frontend — Admin Staff**
- [ ] Attendance summary page per class per period
  - [ ] Grid or table: students (rows) × sessions (cols), status per cell
  - [ ] Summary row: count + % per student

**Frontend — Teacher**
- [ ] Attendance recap view on teacher dashboard — summary per class-subject
- [ ] Per-session attendance history list

**Frontend — Student**
- [ ] My attendance history page `/attendance`
  - [ ] Table: date, subject, status, remarks
  - [ ] Filter by period
  - [ ] Summary: total Hadir / Izin / Sakit / Alpha

---

## Module 8 — Assessment & Grading

### 8.1 — Assessment Types (Tenant-Configured)

**Data Model**
- [ ] Create `TenantAssessmentType` model: `id`, `tenantId`, `name`, `code`, `isEnabled`, `order`, `createdAt`
- [ ] Seed default assessment types on tenant creation: Tugas, Ulangan, UTS, UAS

**API**
- [ ] `GET /assessment-types` — list all assessment types for tenant
- [ ] `POST /assessment-types` — create new type
  - [ ] Validate `code` is unique and immutable after creation
- [ ] `PATCH /assessment-types/:id` — rename type
- [ ] `PATCH /assessment-types/:id/disable` — disable type
- [ ] `PATCH /assessment-types/:id/enable` — enable type
- [ ] `DELETE /assessment-types/:id` — delete type
  - [ ] Reject if type is referenced by any assessment component (return 409)

**Frontend — Admin Staff**
- [ ] Assessment types settings page `/settings/assessment-types`
  - [ ] List of types with name, status, drag-to-reorder
  - [ ] Enable / disable toggle per type
  - [ ] Rename (inline edit)
  - [ ] "Add Type" button → create form (name, code)
  - [ ] Delete button (disabled if in use)

### 8.2 — Assessment Components

**Data Model**
- [ ] Create `AssessmentComponent` model: `id`, `tenantId`, `classSubjectId`, `academicPeriodId`, `assessmentTypeId`, `name`, `maxScore`, `weight` (Decimal), `createdAt`

**API**
- [ ] `GET /class-subjects/:id/components?periodId=` — list assessment components
- [ ] `POST /class-subjects/:id/components` — create assessment component
  - [ ] Validate weights still sum to ≤ 100% after addition
- [ ] `PATCH /components/:id` — edit name, maxScore, weight
  - [ ] Reject edits if any scores recorded
- [ ] `DELETE /components/:id` — delete component
  - [ ] Reject if any scores recorded

**Frontend — Teacher**
- [ ] Assessment component list per class-subject per period
  - [ ] Table: name, type, max score, weight
  - [ ] Weight total indicator (must sum to 100%)
  - [ ] "Add Component" button → form (name, type, max score, weight)
  - [ ] Edit, delete per row

### 8.3 — Score Input

**Data Model**
- [ ] Create `AssessmentScore` model: `id`, `tenantId`, `componentId`, `studentProfileId`, `score` (Decimal 5,2), `isLocked`, `lockedAt`, `createdAt`, `updatedAt`
- [ ] Unique constraint: `(componentId, studentProfileId)`

**API**
- [ ] `GET /components/:id/scores` — list scores for all students per component
- [ ] `PUT /components/:id/scores` — bulk upsert scores for a component
  - [ ] Accept array of `{ studentProfileId, score }`
  - [ ] Reject if any score in batch is locked
- [ ] `PATCH /components/:id/scores/lock` — lock all scores for a component
- [ ] Score change request API (see 8.4)

**Frontend — Teacher: Score Entry**
- [ ] Score entry page per class-subject per period
  - [ ] Select component from dropdown
  - [ ] Table: student name, score input field (numeric), locked badge if locked
  - [ ] "Save All" button — bulk upsert
  - [ ] "Lock Scores" button per component

**Frontend — Teacher: Bulk Score Entry (Grid)**
- [ ] Spreadsheet-style score grid `/class-subjects/:id/scores?periodId=`
  - [ ] Rows = students, cols = assessment components
  - [ ] Inline editable cells (Tab to advance)
  - [ ] Auto-save on cell blur or explicit "Save" button
  - [ ] Locked cells shown as read-only

### 8.4 — Score Change Request Workflow

**Data Model**
- [ ] Create `AssessmentScoreChangeRequest` model: `id`, `tenantId`, `scoreId`, `requestedByTeacherId`, `reason`, `newScore`, `status` (PENDING/RESOLVED), `resolvedAt`, `resolvedById`, `createdAt`

**API**
- [ ] `POST /scores/:id/change-requests` — teacher submits change request
  - [ ] Validate score is locked
  - [ ] Accept: new proposed score, reason
- [ ] `GET /change-requests?status=` — Admin Staff list pending change requests
- [ ] `PATCH /change-requests/:id/resolve` — Admin Staff resolves (approve updates score, reject leaves unchanged)

**Frontend — Teacher**
- [ ] "Request Score Change" button on locked score cell → modal (reason + new value)

**Frontend — Admin Staff**
- [ ] Change request review page `/score-change-requests`
  - [ ] Table: student, subject, component, current score, requested score, reason
  - [ ] Approve / Reject action per row

### 8.5 — Formal Grade Submission

**Data Model**
- [ ] Create `AssessmentSubmission` model: `id`, `tenantId`, `classSubjectId`, `academicPeriodId`, `submittedByTeacherId`, `submittedAt`, `status`

**API**
- [ ] `POST /class-subjects/:id/submit?periodId=` — teacher formally submits grades
  - [ ] Validate all components have scores for all enrolled students
  - [ ] Lock all scores for that class-subject-period
  - [ ] Create submission record

**Frontend — Teacher**
- [ ] "Submit Grades" button on score entry page
  - [ ] Confirmation modal showing summary (students with incomplete scores)
  - [ ] On confirm: call submit API, lock UI

### 8.6 — Assessment Recap (Final Grade Calculation)

**API**
- [ ] `GET /class-subjects/:id/recap?periodId=` — get final computed grade per student
  - [ ] Aggregate scores per component, apply weights, compute weighted average
  - [ ] Return: `studentProfileId`, `totalScore`, `gradeLetter`, per assessment type subtotal
- [ ] `GET /classes/:id/recap?periodId=` — full recap for all subjects for all students in a class

**Frontend — Teacher**
- [ ] Grade recap page `/class-subjects/:id/recap?period=`
  - [ ] Table: student (rows) × components + final score (cols)
  - [ ] Final weighted score + grade letter per student

**Frontend — Student**
- [ ] My grades page `/grades`
  - [ ] Filter by period
  - [ ] Table: subject, score per component, weighted total, grade letter

---

## Module 9 — Rapor (Report Card)

### 9.1 — Report Card Data Model

- [ ] Create `ReportCard` model: `id`, `tenantId`, `studentProfileId`, `academicPeriodId`, `classId`, `status` (DRAFT/REVIEW/APPROVAL/LOCKED), `compiledByHomeroomId`, `approvedById`, `compiledAt`, `approvedAt`, `lockedAt`
- [ ] Create `ReportCardSubject` model: `id`, `reportCardId`, `classSubjectId`, `numericScore` (Decimal), `gradeLetter`, `description` (text), `tenantId`

### 9.2 — Report Card Compilation (Wali Kelas)

**API**
- [ ] `GET /report-cards?classId=&periodId=` — list report cards for a class in a period
- [ ] `POST /report-cards/compile?classId=&periodId=` — Wali Kelas compiles report cards
  - [ ] Validate all class-subjects in the class have submitted grades
  - [ ] Generate `ReportCard` + `ReportCardSubject` records from recap data
  - [ ] Status = DRAFT on first compile
- [ ] `GET /report-cards/:id` — get full report card with all subjects
- [ ] `PATCH /report-cards/subjects/:id/description` — Teacher updates descriptive text for their subject on a report card
- [ ] `PATCH /report-cards/:id/submit-for-review` — Wali Kelas moves report card from DRAFT → REVIEW

**Frontend — Wali Kelas (Teacher)**
- [ ] Report card compilation page `/report-cards/compile?class=:classId&period=:periodId`
  - [ ] Shows all students in class
  - [ ] Per student: compilation status, "View Report Card" link
  - [ ] "Compile All" button — triggers compile API for all students
  - [ ] "Submit for Review" button per student (or bulk)

### 9.3 — Descriptive Feedback (Deskripsi)

**Frontend — Teacher**
- [ ] Descriptive feedback page per student per class-subject
  - [ ] Text area for narrative (Deskripsi)
  - [ ] Auto-saved or explicit save button
  - [ ] Shows current numeric score and grade letter for reference

### 9.4 — Principal Approval Workflow

**API**
- [ ] `GET /report-cards?status=REVIEW` — Principal views all report cards pending review
- [ ] `PATCH /report-cards/:id/approve` — Principal approves → status APPROVAL → LOCKED
  - [ ] Set `approvedById`, `approvedAt`, `lockedAt`
  - [ ] Prevent further edits after LOCKED
- [ ] `PATCH /report-cards/:id/return` — Principal returns report card to DRAFT with notes
  - [ ] Accept: return reason / notes

**Frontend — Principal**
- [ ] Report card approval queue page `/report-cards/approve`
  - [ ] List of all classes × students with status badges
  - [ ] Filter by class, filter by status
  - [ ] "Review" button per student → opens report card preview
- [ ] Report card preview + approval page
  - [ ] Full view of report card (all subjects, scores, grade letters, descriptions)
  - [ ] "Approve" button → confirm modal → lock
  - [ ] "Return with Notes" button → text area for reason

### 9.5 — PDF Export

**API**
- [ ] `GET /report-cards/:id/export` — generate and stream PDF of locked report card
  - [ ] Accept only LOCKED report cards
  - [ ] Render: student info, class, period, all subjects with score/letter/description, school name

**Frontend**
- [ ] "Download PDF" button on report card view page (visible once LOCKED)
  - [ ] Available to: Wali Kelas, Principal, Admin Staff, and the Student themselves

---

## Module 10 — Dashboards

### 10.1 — Admin Staff Dashboard

**API**
- [ ] `GET /dashboard/admin-staff` — return all stats for admin dashboard
  - [ ] Total students (active enrollments in active year)
  - [ ] Total teachers
  - [ ] Total classes
  - [ ] Total subjects
  - [ ] Schedule completion percentage (class-subjects with schedule vs total)
  - [ ] Classes with schedule conflicts
  - [ ] Data issues (class-subjects missing teacher assignment, etc.)
  - [ ] Recent audit log events (last 10)

**Frontend**
- [ ] Admin Staff dashboard `/dashboard`
  - [ ] Stats cards: students, teachers, classes, subjects
  - [ ] Schedule health card (% complete, conflict count)
  - [ ] Quick actions panel: links to classes, subjects, users, schedules
  - [ ] Onboarding checklist (shown until all setup steps complete)
  - [ ] Recent activity panel (audit log events)
  - [ ] Alerts panel (data issues)

### 10.2 — Teacher Dashboard

**API**
- [ ] `GET /dashboard/teacher` — return teacher-specific data
  - [ ] Today's schedule (sessions for today)
  - [ ] Upcoming sessions
  - [ ] Pending grade submissions (class-subjects with unsubmitted grades)
  - [ ] Report cards pending description input

**Frontend**
- [ ] Teacher dashboard `/dashboard`
  - [ ] Today's schedule timeline
  - [ ] "Start Session" shortcut per today's slot
  - [ ] Pending submissions card
  - [ ] My classes quick links

### 10.3 — Student Dashboard

**API**
- [ ] `GET /dashboard/student` — return student-specific data
  - [ ] Today's schedule
  - [ ] Recent attendance records
  - [ ] Latest grades summary

**Frontend**
- [ ] Student dashboard `/dashboard`
  - [ ] Today's schedule
  - [ ] My grades summary card → link to grades page
  - [ ] My attendance summary card → link to attendance page
  - [ ] Latest report card status card

### 10.4 — Principal Dashboard

**API**
- [ ] `GET /dashboard/principal` — return principal overview
  - [ ] Total classes, teachers, students
  - [ ] Report cards pending approval (count by class)
  - [ ] Grade submission progress (how many class-subjects submitted vs total)

**Frontend**
- [ ] Principal dashboard `/dashboard`
  - [ ] School overview stats cards
  - [ ] Report card approval queue summary → link to approval page
  - [ ] Grade submission progress bar by class

---

## Module 11 — Audit Logging

### 11.1 — Audit Log Data Model & Service

- [ ] Create `AuditLog` model: `id`, `tenantId`, `actorId`, `action` (CREATE/UPDATE/DELETE/LOCK/APPROVE), `entityType` (GRADE/ATTENDANCE/REPORT_CARD), `entityId`, `metadata` (JSON), `createdAt`
- [ ] Build `AuditLogService` with a reusable `log(tenantId, actorId, action, entityType, entityId, metadata)` method
- [ ] Emit audit log entry on:
  - [ ] Score created / updated / locked
  - [ ] Attendance created / updated
  - [ ] Report card status transitions (REVIEW / APPROVAL / LOCKED)

### 11.2 — Audit Log Viewer (Admin Staff)

**API**
- [ ] `GET /audit-logs` — paginated list of audit events for tenant
  - [ ] Filter by entityType, action, actorId, date range

**Frontend**
- [ ] Audit log page `/audit-logs`
  - [ ] Table: timestamp, actor name, action, entity type, entity reference
  - [ ] Filter panel: entity type, action, date range, actor
  - [ ] Paginated

---

## Others — Cross-Cutting Tasks

### Non-Functional & Infrastructure

- [ ] Configure rate limiting: 60 req/min per client globally
- [ ] Set up MinIO for file storage (profile field file uploads, report card attachments)
- [ ] Set up environment config management (`.env` per environment: dev / staging / prod)
- [ ] Set up Docker Compose: Postgres + MinIO + API
- [ ] Set up database migration tooling (Prisma migrations)
- [ ] Set up Turborepo workspace structure (backend, frontend, shared packages)
- [ ] Configure Biome (linting + formatting) across all packages
- [ ] API error response standard: consistent `{ error, message, statusCode }` shape

### Security

- [ ] Validate all requests enforce `tenantId` scope in service layer
- [ ] Ensure no endpoint leaks cross-tenant data (integration test pattern)
- [ ] Sanitize and validate all inputs server-side (DTOs + class-validator)

### Design Decisions (Unblocked tasks depend on these)

- [ ] ⚠️ **D1** — Schedule redesign: weekly fixed slots + cron vs generic event model
- [ ] ⚠️ **D2** — Custom profile fields: dynamic system vs simplified fixed+toggleable fields
- [ ] ⚠️ **D3** — Kelas / Rombongan Belajar alignment with K-12 curriculum
- [ ] ⚠️ **D4** — Assessment weights system review
- [ ] ⚠️ **D5** — User creation flow (invite-based vs direct creation — FR-02.4 is TBD)

---

*Based on `docs/functional-requirement-reviewed.md` — 2026-03-07.*
