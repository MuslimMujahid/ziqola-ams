# Test Cases

**Product:** Academic Management System (Multi-Tenant SaaS)  
**Updated:** 2026-03-07  

---

## Conventions

Each test case follows this format:

| Field | Description |
|-------|-------------|
| **ID** | Unique identifier, e.g. `TC-01-001` |
| **Title** | Short description of what is being tested |
| **Preconditions** | State the system must be in before the test runs |
| **Input / Steps** | What data is sent or what action is taken |
| **Expected Result** | What the system should return or display |
| **Type** | `Happy Path` / `Validation` / `Edge Case` / `Security` |

---

## Module 1 — Tenant Registration & Onboarding

### TC-01 — Tenant Registration API (`POST /auth/register`)

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-01-001 | Successful registration creates tenant and first user | No existing tenant with same email | `namaSekolah`, `jenjang=SMA`, `fullName`, unique `email`, valid `password` | HTTP 201. Tenant created (status=ACTIVE). User created (role=ADMIN_STAFF, status=ACTIVE). JWT returned. Slug auto-generated from `namaSekolah`. | Happy Path |
| TC-01-002 | Slug is auto-generated and URL-safe | No tenant with same slug | `namaSekolah = "SMA Negeri 1 Bandung"` | Slug is `sma-negeri-1-bandung` (lowercase, spaces → hyphens, special chars removed) | Happy Path |
| TC-01-003 | Slug collision appends numeric suffix | Existing tenant with slug `sma-negeri-1-bandung` | `namaSekolah = "SMA Negeri 1 Bandung"` | Slug becomes `sma-negeri-1-bandung-2` | Edge Case |
| TC-01-004 | Registration fails if email already registered | Existing user with same email | Same email as existing user | HTTP 409. Error: "Email sudah terdaftar." | Validation |
| TC-01-005 | Registration fails if `jenjang` is invalid | — | `jenjang = "UNIVERSITAS"` | HTTP 400. Error: "Jenjang tidak valid." | Validation |
| TC-01-006 | Registration fails if required fields are missing | — | Missing `namaSekolah` | HTTP 400. Error specifies which field is missing. | Validation |
| TC-01-007 | Registration fails if password too short | — | `password = "abc"` | HTTP 400. Error: password does not meet minimum length. | Validation |
| TC-01-008 | Tenant and user creation are atomic | DB fault injected after tenant but before user | Any valid payload | HTTP 500 or rolled back; no orphan tenant or user created. | Edge Case |

---

### TC-02 — Email Availability Check (`GET /auth/check-email`)

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-02-001 | Returns available when email is not registered | No user with that email | `?email=new@school.com` | HTTP 200. `{ available: true }` | Happy Path |
| TC-02-002 | Returns unavailable when email is taken | Existing user with that email | `?email=existing@school.com` | HTTP 200. `{ available: false }` | Happy Path |
| TC-02-003 | Returns 400 if email param is missing | — | No `email` param | HTTP 400 | Validation |
| TC-02-004 | Case-insensitive email check | Existing user `Admin@School.com` | `?email=admin@school.com` | `{ available: false }` | Edge Case |

---

### TC-03 — Login API (`POST /auth/login`)

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-03-001 | Successful login returns JWT with correct claims | Active user exists | Valid email + password | HTTP 200. JWT containing `userId`, `tenantId`, `role`. | Happy Path |
| TC-03-002 | JWT contains correct role | User has role `TEACHER` | Valid teacher credentials | JWT `role` = `TEACHER` | Happy Path |
| TC-03-003 | Login fails with wrong password | Active user exists | Correct email, wrong password | HTTP 401 | Validation |
| TC-03-004 | Login fails for non-existent email | — | Unknown email | HTTP 401 | Validation |
| TC-03-005 | Login fails for deactivated user | User status = INACTIVE | Valid credentials | HTTP 403 | Security |
| TC-03-006 | No school code or role input required at login | — | Only email + password provided | HTTP 200. Tenant + role resolved from email. | Happy Path |

---

### TC-04 — Registration Page (Frontend)

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-04-001 | Form submits successfully and redirects to onboarding | — | Valid form fields | API called; JWT stored; redirected to `/onboarding` | Happy Path |
| TC-04-002 | Real-time email check marks field invalid when taken | Existing user with email | Type taken email, wait for debounce | Inline error: "Email sudah terdaftar" | Validation |
| TC-04-003 | Password mismatch shows inline error | — | `password ≠ confirmPassword` | Inline error: "Password tidak sama" | Validation |
| TC-04-004 | Submit button disabled until all required fields valid | — | Leave `namaSekolah` empty | Submit button remains disabled | Validation |
| TC-04-005 | Jenjang dropdown contains all 5 options | — | Open dropdown | Options: SD, SMP, SMA, SMK, Lainnya | Happy Path |

---

### TC-05 — Onboarding Page (Frontend)

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-05-001 | New Admin Staff is redirected to `/onboarding` on first login | Tenant has no active academic year | Login as new Admin Staff | Redirected to onboarding page, not dashboard | Happy Path |
| TC-05-002 | Admin Staff is NOT redirected to onboarding after year is set up | Tenant has an active academic year | Login as Admin Staff | Redirected to dashboard directly | Happy Path |
| TC-05-003 | Onboarding prompts Academic Year creation in step 1 | Tenant has no academic year | Load page | Step 1 is "Buat Tahun Ajaran" | Happy Path |
| TC-05-004 | Completing onboarding redirects to dashboard | Complete both steps | Fill year + period | After save, redirect to Admin Staff dashboard | Happy Path |

---

## Module 2 — User Management

### TC-06 — User CRUD API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-06-001 | Admin Staff can list all users in their tenant | 3 users in tenant | `GET /users` as ADMIN_STAFF | HTTP 200. Returns all 3 users. | Happy Path |
| TC-06-002 | List users is scoped to tenant (no cross-tenant leak) | Users in tenant A and tenant B | `GET /users` as user of tenant A | Only tenant A users returned | Security |
| TC-06-003 | Admin Staff can create a Teacher user | — | `POST /users` with role=TEACHER, valid email | HTTP 201. User created. TeacherProfile created. | Happy Path |
| TC-06-004 | Admin Staff can create a Student user | — | `POST /users` with role=STUDENT, valid email | HTTP 201. User created. StudentProfile created. | Happy Path |
| TC-06-005 | Create user fails if email already registered globally | Another tenant has that email | `POST /users` with taken email | HTTP 409. Error: email already exists. | Validation |
| TC-06-006 | Admin Staff can deactivate a user | Active user exists | `PATCH /users/:id/deactivate` | HTTP 200. User status = INACTIVE. | Happy Path |
| TC-06-007 | Admin Staff can reactivate a deactivated user | Inactive user exists | `PATCH /users/:id/reactivate` | HTTP 200. User status = ACTIVE. | Happy Path |
| TC-06-008 | Non-Admin-Staff cannot create users | Authenticated as TEACHER | `POST /users` | HTTP 403 | Security |
| TC-06-009 | Cannot update user from a different tenant | ADMIN_STAFF of tenant A | `PATCH /users/:idFromTenantB` | HTTP 404 or 403 | Security |
| TC-06-010 | Admin Staff can update base user fields | Active user exists | `PATCH /users/:id` with new fullName | HTTP 200. `fullName` updated. | Happy Path |

---

### TC-07 — Teacher Profile API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-07-001 | Get teacher profile returns NIP, NUPTK, hireDate | Teacher profile exists | `GET /users/:id/teacher-profile` | HTTP 200. Profile fields present. | Happy Path |
| TC-07-002 | Admin Staff can update teacher NIP | Teacher profile exists | `PATCH /users/:id/teacher-profile` with `nip` | HTTP 200. NIP updated. | Happy Path |
| TC-07-003 | Teacher profile not available for non-teacher roles | User is STUDENT | `GET /users/:id/teacher-profile` | HTTP 404 or 400 | Validation |

---

### TC-08 — Student Profile API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-08-001 | Get student profile returns NIS, NISN | Student profile exists | `GET /users/:id/student-profile` | HTTP 200. NIS and NISN present. | Happy Path |
| TC-08-002 | Admin Staff can update NIS | Student profile exists | `PATCH /users/:id/student-profile` with `nis` | HTTP 200. NIS updated. | Happy Path |

---

### TC-09 — Email Invite Flow

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-09-001 | Sending invite generates a token and sends email | User created with no password | `POST /users/:id/invite` | HTTP 200. Invite token hash stored. Email sent via provider. | Happy Path |
| TC-09-002 | Duplicate invite re-sends email and resets expiry | User already has invite token | `POST /users/:id/invite` again | HTTP 200. Old token invalidated. New token sent. | Happy Path |
| TC-09-003 | Activation with valid token sets password and activates user | Valid invite token | `POST /auth/activate` with token + new password | HTTP 200. User status = ACTIVE. Token cleared. | Happy Path |
| TC-09-004 | Activation fails with expired token | Invite token past expiry | `POST /auth/activate` with expired token | HTTP 400 or 410. Error: "Token telah kadaluarsa." | Validation |
| TC-09-005 | Activation fails with invalid token | — | `POST /auth/activate` with garbage token | HTTP 400. Error: "Token tidak valid." | Validation |
| TC-09-006 | Expired invite tokens are pruned by nightly job | Multiple expired tokens in DB | Run prune job | All tokens past expiry removed from DB. | Edge Case |

---

## Module 3 — Custom Profile Properties

> ⚠️ Test cases below assume the dynamic custom fields approach. Update if design changes to fixed-field model.

### TC-10 — Field Definition API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-10-001 | Admin Staff creates a TEXT field for Student | — | `POST /profile-fields` type=TEXT, targetType=STUDENT | HTTP 201. Field definition created, scoped to tenant. | Happy Path |
| TC-10-002 | Admin Staff creates a SELECT field with options | — | type=SELECT, options=["Islam","Kristen","Hindu"] | HTTP 201. Options stored. | Happy Path |
| TC-10-003 | Admin Staff creates a FILE field (max 5 MB) | — | type=FILE, maxSizeMb=5, allowedMimes=["image/png"] | HTTP 201. Constraints stored. | Happy Path |
| TC-10-004 | Teacher cannot create field definitions | Authenticated as TEACHER | `POST /profile-fields` | HTTP 403 | Security |
| TC-10-005 | Field definitions from tenant A not visible to tenant B | Fields in tenant A | `GET /profile-fields` as tenant B | Returns empty or only tenant B's fields | Security |
| TC-10-006 | Disabling a field hides it but retains existing values | Field with existing values | `PATCH /profile-fields/:id/disable` | HTTP 200. Field `isEnabled = false`. Values still in DB. | Happy Path |
| TC-10-007 | Re-enabling a field shows values again | Disabled field with values | `PATCH /profile-fields/:id/enable` | HTTP 200. Field `isEnabled = true`. Values accessible. | Happy Path |

---

### TC-11 — Profile Field Values API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-11-001 | Save custom field values for a student | Student + field definitions exist | `PUT /users/:id/custom-fields` with field values | HTTP 200. Values upserted. | Happy Path |
| TC-11-002 | Required field validation rejects empty value | Field with `isRequired = true` | `PUT` without value for required field | HTTP 400. Error specifies which field. | Validation |
| TC-11-003 | MAX length validation rejects overlong text | TEXT field with maxLength=10 | Value with 11 chars | HTTP 400 | Validation |
| TC-11-004 | FILE upload rejects files over 5 MB | FILE-type field, max 5 MB | Upload a 6 MB file | HTTP 400. Error: "Ukuran file melebihi batas." | Validation |
| TC-11-005 | FILE upload rejects disallowed MIME types | FILE field allows only PDF | Upload a PNG | HTTP 400 | Validation |
| TC-11-006 | Students can be filtered by custom field value | Students with `agama = "Islam"` | `GET /students?filter[agama]=Islam` | Returns only matching students | Happy Path |

---

## Module 4 — Academic Structure

### TC-12 — Academic Year API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-12-001 | Admin Staff creates a new academic year | No overlapping year | `POST /academic-years` with name, startDate, endDate | HTTP 201. Year created with status=DRAFT. | Happy Path |
| TC-12-002 | Creation fails if date range overlaps existing year | Existing year 2025-07-01 to 2026-06-30 | New year with range 2026-01-01 to 2026-12-31 | HTTP 409. Error: "Rentang tanggal tumpang tindih." | Validation |
| TC-12-003 | Admin Staff activates a Draft academic year | DRAFT year, existing ACTIVE year is fully ended | `PATCH /academic-years/:id/activate` | HTTP 200. New year = ACTIVE. Previous year = ARCHIVED. | Happy Path |
| TC-12-004 | Exactly one active academic year per tenant at any time | Active year exists | Activate another DRAFT year | Previous active year auto-archived OR blocked with error | Edge Case |
| TC-12-005 | Admin Staff archives an active year | ACTIVE year with ended periods | `PATCH /academic-years/:id/archive` | HTTP 200. Status = ARCHIVED. | Happy Path |
| TC-12-006 | Teacher cannot create or manage academic years | Authenticated as TEACHER | `POST /academic-years` | HTTP 403 | Security |
| TC-12-007 | Cannot edit a non-DRAFT academic year | ACTIVE year | `PATCH /academic-years/:id` with new dates | HTTP 409. Error: "Tidak dapat mengubah tahun ajaran yang aktif." | Validation |

---

### TC-13 — Academic Period API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-13-001 | Admin Staff creates a period within a year | DRAFT academic year | `POST /academic-years/:id/periods` with name, startDate, endDate | HTTP 201. Period created with status=DRAFT. | Happy Path |
| TC-13-002 | Period creation fails if dates overlap another period in same year | Existing period Jan–Jun | New period Mar–Aug in same year | HTTP 409. Error: overlap detected. | Validation |
| TC-13-003 | Period creation fails if start date is before previous period's end date | Existing period ends Jun 30 | New period starts Jun 15 | HTTP 400. Error: start date must be after previous period ends. | Validation |
| TC-13-004 | Activating a period with another already active auto-deactivates previous | Active Semester 1 exists | `PATCH /periods/:id/activate` for Semester 2 | Semester 1 = ARCHIVED. Semester 2 = ACTIVE. | Edge Case |
| TC-13-005 | Exactly one active period per academic year at a time | — | Activate second period | Only one period ACTIVE at a time. | Edge Case |
| TC-13-006 | Cannot edit period dates once ACTIVE | Period is ACTIVE | `PATCH /periods/:id` with new dates | HTTP 409. Error: cannot edit active period. | Validation |

---

### TC-14 — Kelas (Class) API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-14-001 | Admin Staff creates a new class | Active academic year | `POST /classes` with name`="X IPA 1"`, akademicYearId | HTTP 201. Class created. | Happy Path |
| TC-14-002 | Class name is unique per tenant per academic year | Class "X IPA 1" already exists for that year | Create another "X IPA 1" same year | HTTP 409. Error: "Nama kelas sudah digunakan." | Validation |
| TC-14-003 | Same class name allowed in different academic years | "X IPA 1" exists in year 2024/2025 | Create "X IPA 1" in 2025/2026 | HTTP 201. Allowed. | Edge Case |
| TC-14-004 | Admin Staff can delete a class with no enrollments | Class with no enrollments, no subjects | `DELETE /classes/:id` | HTTP 200. Class deleted. | Happy Path |
| TC-14-005 | Cannot delete a class that has student enrollments | Class with enrolled students | `DELETE /classes/:id` | HTTP 409. Error: "Kelas memiliki siswa yang terdaftar." | Validation |

---

### TC-15 — Wali Kelas Assignment API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-15-001 | Assign a teacher as homeroom for a class | Class + teacher with TEACHER role | `POST /classes/:id/homeroom` with teacherProfileId | HTTP 201. HomeroomAssignment created. | Happy Path |
| TC-15-002 | Cannot assign a non-teacher as homeroom | User is ADMIN_STAFF | `POST /classes/:id/homeroom` with adminProfileId | HTTP 400. Error: "Wali kelas harus memiliki peran guru." | Validation |
| TC-15-003 | Cannot assign homeroom if one already exists for that year | Homeroom already assigned | `POST /classes/:id/homeroom` again | HTTP 409. Error: "Kelas sudah memiliki wali kelas." | Validation |
| TC-15-004 | Reassigning homeroom ends previous assignment | Existing homeroom assignment | `PATCH /classes/:id/homeroom` with new teacher | HTTP 200. Old assignment gets endDate. New assignment created. | Happy Path |
| TC-15-005 | Remove homeroom assignment | Existing homeroom | `DELETE /classes/:id/homeroom` | HTTP 200. Assignment deleted. | Happy Path |

---

### TC-16 — Rombongan Belajar (Class Group) API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-16-001 | Admin Staff creates a STREAM group | — | `POST /groups` type=STREAM, name="IPA" | HTTP 201. Group created. | Happy Path |
| TC-16-002 | Cannot create a GRADE group manually | — | `POST /groups` type=GRADE | HTTP 400. Error: "GRADE dikelola oleh sistem." | Validation |
| TC-16-003 | Assign GRADE group to class | Class + GRADE group "X" exists | `POST /classes/:id/groups` with gradeGroupId | HTTP 201. Class now has GRADE group. | Happy Path |
| TC-16-004 | Assign non-GRADE group to class | Class already has GRADE group | Assign STREAM group | HTTP 201. Class has 2 groups total. | Happy Path |
| TC-16-005 | Cannot assign a second non-GRADE group to a class | Class has GRADE + STREAM | Assign PROGRAM group | HTTP 409. Error: max one non-GRADE group per class. | Validation |
| TC-16-006 | Cannot assign a second GRADE group | Class already has a GRADE group | Assign another GRADE group | HTTP 409. Error: max one GRADE group per class. | Validation |
| TC-16-007 | GRADE groups seeded on tenant creation by Jenjang | New tenant, Jenjang=SMP | — | Groups 7, 8, 9 auto-created with type=GRADE. | Happy Path |

---

### TC-17 — Student Enrollment API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-17-001 | Enroll a student in a class | Student + class in same tenant and academic year | `POST /classes/:id/enrollments` with studentProfileId | HTTP 201. ClassEnrollment created with startDate=today. | Happy Path |
| TC-17-002 | Cannot enroll student from a different tenant | Student in tenant A, class in tenant B | Enroll student cross-tenant | HTTP 404 or 403 | Security |
| TC-17-003 | Cannot enroll student already actively enrolled in another class same year | Student enrolled in X IPA 1 | Enroll same student in X IPA 2 same year | HTTP 409. Error: "Siswa sudah terdaftar di kelas lain." | Validation |
| TC-17-004 | Mid-year transfer ends current enrollment and creates new | Student enrolled in X IPA 1 | `PATCH /enrollments/:id/transfer` to X IPA 2 | Old enrollment `endDate = today`. New enrollment created in X IPA 2. | Happy Path |
| TC-17-005 | Cannot delete enrollment with recorded attendance | Enrollment with attendance records | `DELETE /enrollments/:id` | HTTP 409. Error: "Tidak dapat menghapus: ada data absensi." | Validation |

---

## Module 5 — Subjects & Teaching Assignments

### TC-18 — Subject API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-18-001 | Admin Staff creates a subject | — | `POST /subjects` name="Matematika" | HTTP 201. Subject created, scoped to tenant. | Happy Path |
| TC-18-002 | Subject name unique per tenant | "Matematika" already exists | Create "Matematika" again | HTTP 409. Error: "Mata pelajaran sudah ada." | Validation |
| TC-18-003 | Soft-deleted subject name can be reused | "Matematika" was soft-deleted | Create "Matematika" | HTTP 201. New active subject created. | Edge Case |
| TC-18-004 | Admin Staff soft-deletes a subject | Subject not assigned to any active class | `DELETE /subjects/:id` | HTTP 200. `isDeleted = true`. Not returned in list. | Happy Path |
| TC-18-005 | Cannot delete an assigned subject | Subject assigned to a ClassSubject | `DELETE /subjects/:id` | HTTP 409. Error: "Mata pelajaran masih digunakan." | Validation |

---

### TC-19 — Teaching Assignment (Class Subject) API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-19-001 | Admin Staff assigns subject + teacher to class | Class, subject, teacher all in same tenant | `POST /classes/:id/subjects` with subjectId, teacherProfileId | HTTP 201. ClassSubject created. | Happy Path |
| TC-19-002 | Cannot assign same subject twice to same class in same year | ClassSubject already exists | `POST /classes/:id/subjects` same subjectId | HTTP 409. Error: "Mata pelajaran sudah ditugaskan ke kelas ini." | Validation |
| TC-19-003 | Cannot assign a non-teacher user as subject teacher | User is ADMIN_STAFF | `POST /classes/:id/subjects` with adminProfileId | HTTP 400. Error: "Pengajar harus memiliki peran guru." | Validation |
| TC-19-004 | Admin Staff updates assigned teacher for class-subject | ClassSubject exists | `PATCH /classes/:id/subjects/:id` new teacherProfileId | HTTP 200. Teacher updated. | Happy Path |
| TC-19-005 | Cannot remove class-subject that has assessment components | Components exist | `DELETE /classes/:id/subjects/:id` | HTTP 409. Error: "Ada komponen penilaian yang terkait." | Validation |

---

### TC-20 — Assessment Weights API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-20-001 | Teacher saves weights that total 100% | ClassSubject + Period exist, no scores yet | `PUT /class-subjects/:id/weights` with weights totaling 100 | HTTP 200. Weights saved. | Happy Path |
| TC-20-002 | Saving weights fails if total ≠ 100% | — | Weights summing to 90 | HTTP 400. Error: "Total bobot harus 100%." | Validation |
| TC-20-003 | Weights locked once any score is recorded | Score exists for this class-subject-period | `PUT /class-subjects/:id/weights` | HTTP 409. Error: "Bobot tidak dapat diubah setelah penilaian dimulai." | Validation |
| TC-20-004 | Different weight sets per period allowed | ClassSubject with 2 periods | Different weights for period 1 vs period 2 | HTTP 200 for both. Each period has independent weights. | Happy Path |

---

## Module 6 — Scheduling

### TC-21 — Schedule API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-21-001 | Admin Staff creates a schedule slot | ClassSubject + Period + available time | `POST /schedules` day=MONDAY, startTime=08:00, endTime=09:00 | HTTP 201. Schedule created. | Happy Path |
| TC-21-002 | Conflict detected for teacher double-booked at same time | Teacher has slot M08:00 in class A | Add M08:00 for same teacher in class B same period | HTTP 409. Error: "Guru sudah dijadwalkan di waktu yang sama." Conflict details returned. | Validation |
| TC-21-003 | Same time slot allowed for different teachers | Different teachers | Two classes same period same time, different teachers | HTTP 201. No conflict. | Happy Path |
| TC-21-004 | Editing a schedule slot re-validates conflict | Teacher double-booked after edit | `PATCH /schedules/:id` move to conflicting time | HTTP 409. Conflict details returned. | Validation |
| TC-21-005 | Delete schedule slot with no associated sessions | No sessions for this slot | `DELETE /schedules/:id` | HTTP 200. Schedule deleted. | Happy Path |
| TC-21-006 | Student schedule view only shows their enrolled class | Student enrolled in X IPA 1, not X IPA 2 | `GET /schedules/student` | Only X IPA 1 schedule returned. Not X IPA 2. | Security |
| TC-21-007 | Teacher schedule view shows all class-subjects they are assigned | Teacher assigned to 3 ClassSubjects | `GET /schedules/teacher` | All 3 class schedules shown. | Happy Path |

---

### TC-22 — Sessions API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-22-001 | Admin Staff manually creates a session | Schedule slot + active period | `POST /sessions` scheduleId, date | HTTP 201. Session created. | Happy Path |
| TC-22-002 | Teacher starts a session from a schedule slot | Teacher assigned to that class-subject | `POST /sessions/start` scheduleId, date | HTTP 201. Session created with class/subject/period from schedule. | Happy Path |
| TC-22-003 | Duplicate session blocked for same schedule + date | Session already exists | `POST /sessions` same scheduleId + date | HTTP 409. Error: "Sesi untuk jadwal dan tanggal ini sudah ada." | Validation |
| TC-22-004 | Teacher can start session outside scheduled time | Session for past slot | `POST /sessions/start` on a weekend | HTTP 201. No time-window enforcement. | Happy Path |
| TC-22-005 | Admin Staff deletes session with no attendance | Session with 0 attendance records | `DELETE /sessions/:id` | HTTP 200 | Happy Path |
| TC-22-006 | Cannot delete session with attendance records | Session has attendance | `DELETE /sessions/:id` | HTTP 409. Error: "Ada data absensi pada sesi ini." | Validation |

---

## Module 7 — Attendance

### TC-23 — Attendance Recording API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-23-001 | Teacher saves attendance for all enrolled students | Session with 10 enrolled students | `PUT /sessions/:id/attendance` with statuses for all 10 | HTTP 200. 10 records upserted. | Happy Path |
| TC-23-002 | Partial save allowed (not all students need to be submitted at once) | Session with 10 students | Submit attendance for 5 | HTTP 200. Only supplied records saved. | Edge Case |
| TC-23-003 | Duplicate attendance record upserts (not duplicate-creates) | Attendance already recorded | `PUT` same data again | HTTP 200. Records updated, no duplicate rows. | Edge Case |
| TC-23-004 | All 4 statuses accepted: Hadir, Izin, Sakit, Alpha | — | Submit all 4 statuses | HTTP 200. All accepted. | Happy Path |
| TC-23-005 | Remarks field saved correctly | — | Submit with `remarks = "Keterangan dokter"` | HTTP 200. Remarks stored. | Happy Path |
| TC-23-006 | Another teacher cannot record attendance for a class-subject they are not assigned to | Teacher assigned to Matematika, not Fisika | `PUT /sessions/:fisika_session_id/attendance` | HTTP 403 | Security |
| TC-23-007 | Admin Staff can record attendance for any class | ADMIN_STAFF role | `PUT /sessions/:id/attendance` | HTTP 200. Allowed. | Happy Path |

---

### TC-24 — Attendance Summary API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-24-001 | Per-student attendance summary returns correct counts | 10 sessions: H=7, I=1, S=1, A=1 | `GET /students/:id/attendance-summary?periodId=` | Returns `{ hadir:7, izin:1, sakit:1, alpha:1, total:10 }` | Happy Path |
| TC-24-002 | Attendance summary scoped to requested period | 2 periods, different data | Request period 1 summary | Only period 1 data returned | Happy Path |
| TC-24-003 | Class attendance returns data for all enrolled students | 30 students in class | `GET /classes/:id/attendance-summary?periodId=` | Returns 30 rows | Happy Path |
| TC-24-004 | Student can view their own attendance history | — | `GET /dashboard/student` (attendance section) | Attendance visible. | Happy Path |
| TC-24-005 | Student cannot view other students' attendance | Authenticated as student A | Request student B's attendance | HTTP 403 | Security |

---

## Module 8 — Assessment & Grading

### TC-25 — Assessment Types API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-25-001 | Default assessment types seeded on tenant creation | New tenant | — | Types present: Tugas, Ulangan, UTS, UAS | Happy Path |
| TC-25-002 | Admin Staff renames an assessment type | Existing type "Tugas" | `PATCH /assessment-types/:id` name="PR" | HTTP 200. Name updated to "PR". Code unchanged. | Happy Path |
| TC-25-003 | Admin Staff disables an assessment type | "Quiz" type exists | `PATCH /assessment-types/:id/disable` | HTTP 200. `isEnabled = false`. Not shown in teacher component creation form. | Happy Path |
| TC-25-004 | Cannot delete type referenced by a component | Type used in an AssessmentComponent | `DELETE /assessment-types/:id` | HTTP 409. Error: "Tipe sudah digunakan dalam komponen penilaian." | Validation |
| TC-25-005 | Type code is immutable after creation | Type "quiz" created | `PATCH` code to "test" | HTTP 400. Error: "Kode tipe tidak dapat diubah." | Validation |
| TC-25-006 | Non-Admin-Staff cannot manage assessment types | Authenticated as TEACHER | `POST /assessment-types` | HTTP 403 | Security |

---

### TC-26 — Assessment Components API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-26-001 | Teacher creates an assessment component | ClassSubject + Period exist | `POST /class-subjects/:id/components` name="Ulangan 1", type=UTS, maxScore=100, weight=30 | HTTP 201. Component created. | Happy Path |
| TC-26-002 | Total weight can reach 100% across multiple components | Existing components totaling 70% | Add component with weight=30 | HTTP 201. Total now 100%. | Happy Path |
| TC-26-003 | Cannot add component if total weight would exceed 100% | Existing components totaling 80% | Add component with weight=30 | HTTP 400. Error: "Total bobot melebihi 100%." | Validation |
| TC-26-004 | Cannot edit a component after scores have been recorded | Component has scores | `PATCH /components/:id` new maxScore | HTTP 409. Error: "Tidak dapat mengubah komponen yang sudah dinilai." | Validation |
| TC-26-005 | Cannot delete a component with scores | Scores exist | `DELETE /components/:id` | HTTP 409 | Validation |

---

### TC-27 — Score Input API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-27-001 | Teacher bulk-saves scores for all students | Component + 10 enrolled students | `PUT /components/:id/scores` with scores for all 10 | HTTP 200. All 10 scores upserted. | Happy Path |
| TC-27-002 | Score below 0 is rejected | — | score = -5 | HTTP 400. Error: "Nilai tidak boleh kurang dari 0." | Validation |
| TC-27-003 | Score above maxScore is rejected | maxScore = 100 | score = 110 | HTTP 400. Error: "Nilai melebihi nilai maksimum." | Validation |
| TC-27-004 | Score input rejected for locked component | Component is locked | `PUT /components/:id/scores` | HTTP 409. Error: "Penilaian sudah dikunci." | Validation |
| TC-27-005 | Teacher locks scores for a component | Component with all scores filled | `PATCH /components/:id/scores/lock` | HTTP 200. All scores `isLocked = true`. | Happy Path |
| TC-27-006 | Teacher assigned to different class-subject cannot enter scores | Teacher not assigned to this ClassSubject | `PUT /components/:id/scores` | HTTP 403 | Security |
| TC-27-007 | Score saved for student not enrolled in the class is rejected | StudentProfile from another class | Submit score for that student | HTTP 400. Error: "Siswa tidak terdaftar di kelas ini." | Validation |

---

### TC-28 — Score Change Request API

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-28-001 | Teacher submits change request for a locked score | Score is locked | `POST /scores/:id/change-requests` reason, newScore=85 | HTTP 201. Change request created with status=PENDING. | Happy Path |
| TC-28-002 | Cannot submit change request for an unlocked score | Score is not locked | `POST /scores/:id/change-requests` | HTTP 400. Error: "Perubahan hanya dapat diminta untuk nilai yang sudah dikunci." | Validation |
| TC-28-003 | Admin Staff approves change request → score updated | Pending change request | `PATCH /change-requests/:id/resolve` approve=true | HTTP 200. Score updated to newScore. Status=RESOLVED. | Happy Path |
| TC-28-004 | Admin Staff rejects change request → score unchanged | Pending change request | `PATCH /change-requests/:id/resolve` approve=false | HTTP 200. Score unchanged. Status=RESOLVED. | Happy Path |

---

### TC-29 — Formal Grade Submission

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-29-001 | Teacher submits grades when all students have scores | All students have scores for all components | `POST /class-subjects/:id/submit?periodId=` | HTTP 200. Submission recorded. All scores locked. | Happy Path |
| TC-29-002 | Submission fails if any student is missing a score | One student has no score | `POST /class-subjects/:id/submit?periodId=` | HTTP 400. Error: lists students with missing scores. | Validation |
| TC-29-003 | Teacher cannot re-submit after submission (idempotent) | Submission already exists | `POST /class-subjects/:id/submit?periodId=` again | HTTP 409. Error: "Penilaian sudah disubmit." | Edge Case |

---

### TC-30 — Assessment Recap

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-30-001 | Recap correctly aggregates weighted scores | 3 components: w=40,40,20; scores=80,90,70 | `GET /class-subjects/:id/recap?periodId=` | Final score = (80×40 + 90×40 + 70×20) / 100 = 83 | Happy Path |
| TC-30-002 | Recap returns grade letter based on score | Final score = 83 | — | GradeLetter = "B" (or per configured scale) | Happy Path |
| TC-30-003 | Student can view their own recap | — | `GET /grades` as student | Their recap visible. | Happy Path |
| TC-30-004 | Student cannot view another student's recap | Authenticated as student A | Request student B's recap | HTTP 403 | Security |

---

## Module 9 — Rapor (Report Card)

### TC-31 — Report Card Compilation

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-31-001 | Wali Kelas compiles report cards for all class students | All class-subjects submitted grades | `POST /report-cards/compile?classId=&periodId=` | HTTP 200. ReportCard + ReportCardSubjects created for each student. Status=DRAFT. | Happy Path |
| TC-31-002 | Compilation fails if any class-subject has unsubmitted grades | One ClassSubject not submitted | `POST /report-cards/compile` | HTTP 400. Error: lists class-subjects missing submission. | Validation |
| TC-31-003 | Non-homeroom teacher cannot compile report cards | Teacher not assigned as Wali Kelas for that class | `POST /report-cards/compile?classId=` | HTTP 403 | Security |
| TC-31-004 | Re-compiling updates existing DRAFT report card | Report card exists in DRAFT | Compile again after adding a subject | HTTP 200. Existing DRAFT updated. | Edge Case |
| TC-31-005 | Cannot re-compile a LOCKED report card | Report card is LOCKED | `POST /report-cards/compile` | HTTP 409. Error: "Rapor sudah dikunci." | Validation |

---

### TC-32 — Descriptive Feedback

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-32-001 | Teacher saves description for their subject on a report card | ReportCard in DRAFT, teacher assigned to subject | `PATCH /report-cards/subjects/:id/description` text | HTTP 200. Description saved. | Happy Path |
| TC-32-002 | Teacher cannot edit description for a subject they don't teach | Teacher assigned to Matematika | `PATCH /report-cards/subjects/:biologySubjectId/description` | HTTP 403 | Security |
| TC-32-003 | Cannot edit description after report card is LOCKED | ReportCard is LOCKED | `PATCH /report-cards/subjects/:id/description` | HTTP 409 | Validation |

---

### TC-33 — Principal Approval

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-33-001 | Wali Kelas submits report card for review | Report card in DRAFT | `PATCH /report-cards/:id/submit-for-review` | HTTP 200. Status = REVIEW. | Happy Path |
| TC-33-002 | Principal sees all report cards in REVIEW status | Multiple REVIEW report cards | `GET /report-cards?status=REVIEW` | Returns all pending approval cards. | Happy Path |
| TC-33-003 | Principal approves report card → LOCKED | Report card in REVIEW/APPROVAL | `PATCH /report-cards/:id/approve` | HTTP 200. Status = LOCKED. `approvedAt`, `lockedAt` set. | Happy Path |
| TC-33-004 | Principal returns report card with notes → back to DRAFT | Report card in REVIEW | `PATCH /report-cards/:id/return` with notes | HTTP 200. Status = DRAFT. Notes stored. | Happy Path |
| TC-33-005 | Non-Principal cannot approve report cards | Authenticated as TEACHER | `PATCH /report-cards/:id/approve` | HTTP 403 | Security |
| TC-33-006 | Cannot approve a DRAFT report card (must be in REVIEW) | Report card in DRAFT | `PATCH /report-cards/:id/approve` | HTTP 409. Error: "Rapor belum diajukan untuk persetujuan." | Validation |
| TC-33-007 | Locked report card cannot be edited | Status = LOCKED | Edit any field on report card | HTTP 409. Error: "Rapor sudah dikunci." | Validation |

---

### TC-34 — PDF Export

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-34-001 | Download PDF succeeds for LOCKED report card | Report card is LOCKED | `GET /report-cards/:id/export` | HTTP 200. PDF stream returned. Content-Type: application/pdf | Happy Path |
| TC-34-002 | PDF contains required fields | — | Download PDF | PDF has: Nama Siswa, Kelas, Periode, list of subjects with score/grade/description, Nama Sekolah | Happy Path |
| TC-34-003 | PDF export rejected for non-LOCKED report card | Report card is DRAFT | `GET /report-cards/:id/export` | HTTP 409. Error: "Rapor belum dikunci." | Validation |
| TC-34-004 | Student can download their own report card PDF | Authenticated as student | `GET /report-cards/:id/export` | HTTP 200. PDF returned. | Happy Path |
| TC-34-005 | Student cannot download another student's report card | Authenticated as student A | `GET /report-cards/:idOfStudentB/export` | HTTP 403 | Security |

---

## Module 10 — Dashboards

### TC-35 — Admin Staff Dashboard

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-35-001 | Dashboard returns all live stats | Active year with classes, students, teachers | `GET /dashboard/admin-staff` | HTTP 200. All stat fields present with real values (not hardcoded). | Happy Path |
| TC-35-002 | Student count reflects active enrollments only | 30 enrolled, 2 deactivated | `GET /dashboard/admin-staff` | `studentCount = 30`, not 32. | Edge Case |
| TC-35-003 | Schedule completion % correctly calculated | 5 class-subjects, 3 have schedules | — | `schedulePercentage = 60%` | Happy Path |
| TC-35-004 | Dashboard is scoped to requesting user's tenant | Admin Staff from tenant A | `GET /dashboard/admin-staff` | Only tenant A data returned. | Security |
| TC-35-005 | Non-Admin-Staff cannot access Admin Staff dashboard | Authenticated as TEACHER | `GET /dashboard/admin-staff` | HTTP 403 | Security |
| TC-35-006 | Onboarding checklist shown only when setup is incomplete | New tenant, no academic year | Load dashboard | Onboarding checklist rendered. | Happy Path |
| TC-35-007 | Onboarding checklist hidden after full setup | Tenant fully configured | Load dashboard | Checklist not shown. | Happy Path |

---

### TC-36 — Teacher Dashboard

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-36-001 | Teacher sees only their own schedule | 2 teachers in same school | `GET /dashboard/teacher` as teacher A | Only teacher A's schedule shown. | Security |
| TC-36-002 | "Pending submissions" shows class-subjects where grades are not yet submitted | Teacher has 1 unsubmitted class-subject | `GET /dashboard/teacher` | 1 item in pending submissions. | Happy Path |

---

### TC-37 — Student Dashboard

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-37-001 | Student sees their enrolled class schedule | Student enrolled in X IPA 1 | `GET /dashboard/student` | X IPA 1 schedule shown. | Happy Path |
| TC-37-002 | Student cannot see other classes' schedules | — | `GET /dashboard/student` as student A | Only student A's class data shown. | Security |
| TC-37-003 | Student grades visible from student dashboard | Grades submitted for student | Load grades page | Subject scores + grade letters visible. | Happy Path |
| TC-37-004 | Student attendance history visible from student dashboard | Attendance recorded | Load attendance page | Per-session attendance records visible. | Happy Path |

---

### TC-38 — Principal Dashboard

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-38-001 | Principal sees school-wide stats | Active year with data | `GET /dashboard/principal` | Classes, teachers, student counts returned. | Happy Path |
| TC-38-002 | Principal sees pending report card count | 5 REVIEW report cards | `GET /dashboard/principal` | `pendingApprovalCount = 5` | Happy Path |
| TC-38-003 | Non-Principal cannot access principal dashboard | Authenticated as ADMIN_STAFF | `GET /dashboard/principal` | HTTP 403 | Security |

---

## Module 11 — Audit Logging

### TC-39 — Audit Log Generation & Viewer

| ID | Title | Preconditions | Input | Expected Result | Type |
|----|-------|---------------|-------|----------------|------|
| TC-39-001 | Audit log created when score is updated | Score exists | Update score | New AuditLog row: action=UPDATE, entityType=GRADE | Happy Path |
| TC-39-002 | Audit log created when attendance is saved | Session exists | Save attendance | New AuditLog row: action=CREATE or UPDATE, entityType=ATTENDANCE | Happy Path |
| TC-39-003 | Audit log created when report card is LOCKED | Report card LOCKED | Approval action | New AuditLog row: action=LOCK, entityType=REPORT_CARD | Happy Path |
| TC-39-004 | Audit log records correct actor | Teacher performs action | Any logged action | `actorId` = the authenticated user's ID | Happy Path |
| TC-39-005 | Admin Staff can list audit logs with pagination | 100 audit events | `GET /audit-logs?page=1&limit=20` | Returns 20 events, pagination metadata correct | Happy Path |
| TC-39-006 | Audit logs filterable by entityType | Mix of GRADE and ATTENDANCE logs | `GET /audit-logs?entityType=GRADE` | Only GRADE logs returned | Happy Path |
| TC-39-007 | Audit logs filterable by date range | Logs across 30 days | `GET /audit-logs?from=2026-01-01&to=2026-01-31` | Only Jan 2026 logs returned | Happy Path |
| TC-39-008 | Audit log is tenant-scoped | Logs in tenant A and tenant B | Admin Staff of tenant A calls `GET /audit-logs` | Only tenant A logs returned | Security |

---

## Cross-Cutting Security Tests

| ID | Title | Input | Expected Result |
|----|-------|-------|----------------|
| SEC-001 | All endpoints require authentication | No JWT / expired JWT | HTTP 401 |
| SEC-002 | All data responses exclude other tenant's data | Any authenticated user | Only own tenant data returned |
| SEC-003 | Rate limiter blocks excessive requests | 61 requests in 1 minute from same client | 61st request returns HTTP 429 |
| SEC-004 | Passwords not returned in any API response | Any user fetch | `passwordHash` field never included in response |
| SEC-005 | JWT with tampered payload rejected | Decoded JWT, change `role`, re-encode without secret | HTTP 401 |
| SEC-006 | Student cannot call any admin-only endpoint | Authenticated as STUDENT | `POST /classes`, `POST /subjects`, etc. → HTTP 403 |
| SEC-007 | Teacher cannot call admin-only user management endpoints | Authenticated as TEACHER | `POST /users`, `DELETE /users/:id` → HTTP 403 |

---

*Based on `docs/tasks.md` — 2026-03-07.*
