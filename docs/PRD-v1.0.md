# Product Requirement Document (PRD)

## Product Name

Academic Management System (Multi-Tenant SaaS)

## Version

MVP – v1.0

## Document Purpose

This document defines the **Minimum Viable Product (MVP)** requirements for a **multi-tenant academic management system** designed for **Indonesian schools and educational institutions**. It serves as a single source of truth for product, design, and engineering teams.

---

## 1. Product Overview

### 1.1 Problem Statement

Most Indonesian schools still rely on **paper-based or fragmented systems** for academic and administrative operations, leading to:

- Inefficiency and data duplication
- Difficult long-term data archiving
- Limited transparency for stakeholders

### 1.2 Solution

A **cloud-based, multi-tenant academic management system** that digitizes core academic workflows end-to-end:

- Academic year management
- Class and student management
- Scheduling and attendance
- Grading and rapor generation

### 1.3 Language & Terminology Strategy

- **User-facing language:** Indonesian, using familiar local academic terms
- **Internal code & development language:** English
- A formal **Terminology Mapping** is maintained to align product language with technical implementation

---

## 2. Product Scope

### 2.1 In-Scope (MVP)

- Single-school tenants (one school = one tenant)
- Indonesian language only
- Core academic operations
- Role-based access control

### 2.2 Out of Scope (Phase 2)

- Orang Tua / Wali Murid portal
- Finance (SPP, billing)
- Learning Management System (LMS)
- Messaging / chat
- Mobile application
- Excel import/export
- Per-subject assessment type overrides

---

## 3. Tenant & Architecture Requirements

### 3.1 Tenant Model

- One tenant represents **one school and one level** (e.g., SD only)
- Schools with multiple levels must create multiple tenants

### 3.2 Data Isolation

- Logical isolation using `tenant_id`
- All data access must be tenant-scoped

### 3.3 Deployment

- Cloud SaaS only

---

### 3.4 Tenant Registration & Onboarding Flow

#### Overview

Tenant registration enables a school or educational institution to create an isolated workspace (tenant) in the system. The process is designed to be **simple, fast, and safe**, while ensuring data integrity and future scalability.

At MVP, tenant registration focuses on **institution identity and administrative access**, deferring academic configuration to post-registration setup.

---

#### Registration Principles

- One tenant represents **one school / institution**
- The **first user is Admin Staff (Staf Administrasi)**, not Principal
- Curriculum selection is **out of scope** during registration
- Minimal required data to reduce onboarding friction
- Tenant identity must be **globally unique** via `Kode Sekolah`

---

#### Registration Form (Public)

**Form Fields:**
| Field | Description | Required |
| --- | --- | --- |
| Kode Sekolah | URL-safe unique school identifier (e.g., `sm-1-bdg`) | ✅ |
| Nama Sekolah | Official / commonly used school name | ✅ |
| Jenjang | SD / SMP / SMA / SMK / Lainnya | ✅ |

**Notes:**

- `Kode Sekolah` is used for:
  - Tenant identification
  - URL path
  - Human-readable tenant reference

---

#### Real-Time Kode Sekolah Availability Check

Before form submission, the system MUST:

- Validate `Kode Sekolah` format (lowercase, alphanumeric, hyphen)
- Perform **real-time availability check** against existing tenants

**Expected Behavior:**

- Immediate feedback (available / already taken)
- Submission is blocked if kode sekolah is unavailable

---

#### First User Creation

After successful tenant creation, the registrant creates the **first user account**.

**First User Characteristics:**

- Assigned system role: `ADMIN_STAFF`
- Has full administrative access by default

**Required User Fields:**

- Full Name
- Email (login identifier)
- Password

Additional personal attributes (gender, birth date, NIP, etc.) may be completed later.

---

#### Default System State After Registration

| Entity           | State        |
| ---------------- | ------------ |
| Tenant           | Active       |
| Admin Staff User | Active       |
| Academic Year    | Not created  |
| Curriculum       | Not selected |

The system redirects the user to the **Admin Dashboard** with onboarding guidance.

---

#### Post-Registration Setup

The following are handled **after** tenant registration:

- Academic year (Tahun Ajaran) creation
- Academic period configuration
- Principal role assignment
- Class, teacher, and student setup

---

## 4. User Roles & Permissions

### 4.0 User Identity vs Academic Profiles

The system **separates authentication identity from academic identity**.

- `User` represents **login identity and general personal attributes**
- Academic attributes are stored in **role-specific profiles** (`Teacher`, `Student`)

This separation ensures flexibility across different institution types while still supporting common demographic data.

**User-level attributes (shared by all roles):**

- Full name
- Gender
- Date of birth
- Contact information (email, phone – optional)

Academic identifiers such as **NIP, NUPTK, NIS, NISN, Student ID**, or other internal numbers are **not stored on User**.

Instead:

- Teacher identifiers belong to the **Teacher profile**
- Student identifiers belong to the **Student profile**

Identifier requirements may vary per tenant.

---

### 4.3 Custom Profile Properties (Student & Teacher)

The system supports **tenant-specific custom profile properties** for **Student** and **Teacher** profiles.

**Key Principles:**

- Student and Teacher custom fields are **separate** (no shared definitions).
- Only **Admin Staff** can configure custom fields; other roles only **fill** data.
- Custom fields are **tenant-scoped**; data and definitions are isolated by `tenant_id`.
- Custom fields are **current-value only** (no historical versioning of values).

**Global Templates (Versioned):**

- Provide **global templates** for Student and Teacher fields.
- Templates are **versioned** and can be **applied or upgraded** by tenants.
- Upgrades are **explicit** and **non-destructive**.

**Tenant Overrides:**

- Tenants can **add, edit, disable** fields after applying a template.
- Disabling a field **hides it** but **retains stored values**.

**Supported Field Types:**

- Text, Number, Date, Boolean
- Select, Multi-select
- File (stored in **MinIO**, max **5 MB** per file)

**Validation Rules:**

- Required/optional
- Min/Max (length or numeric)
- Regex pattern
- Date range
- File constraints (size, MIME types)

**Filtering & Reporting (Phase 1):**

- Custom fields must be **queryable** for filtering (e.g., religion, domicile, achievements).
- Data storage must support **search and export** of custom field values.

---

### 4.4 Assessment Type Customization (Tenant-Level)

The system supports **tenant-specific assessment types** that define categories used when creating assessment components.

**Key Principles:**

- Assessment types are **tenant-scoped** and used across all subjects in the tenant.
- Only **Admin Staff** can configure assessment types.
- A **default template** is provided (e.g., Assignment, Quiz, Midterm, Final).
- Types can be **renamed or disabled**.
- **Type identifiers are immutable** once used in components.
- **Hard delete is not allowed** for types that are already referenced.

---

### 4.1 Roles (MVP)

Roles represent a **user’s primary identity** within a tenant. Roles are global and not contextual.

| Role            | Description                     |
| --------------- | ------------------------------- |
| Kepala Sekolah  | Academic oversight and approval |
| Tata Usaha (TU) | Administrative operations       |
| Guru            | Teaching staff                  |
| Siswa           | View-only academic access       |

> **Important:** _Wali Kelas is NOT a role._ It is a **class-level assignment** given to a Guru for a specific academic year.

### 4.2 Permission Model

- Hybrid RBAC
- Fixed roles with configurable permissions
- One user belongs to exactly one tenant

-----|------------|
| Kepala Sekolah | Academic oversight and approval |
| Tata Usaha (TU) | Administrative operations |
| Guru | Teaching staff |
| Siswa | View-only academic access |

> **Important:** _Wali Kelas is NOT a role._ It is a **class-level assignment** given to a Guru for a specific academic year.

### 4.2 Permission Model

- Hybrid RBAC
- Fixed roles with configurable permissions
- One user belongs to exactly one tenant

---

## 5. Academic Structure Requirements

### 5.1 Tahun Ajaran

- Exactly **one active tahun ajaran per tenant**
- Status: Draft, Active, Archived
- A Tahun Ajaran contains **configurable Academic Periods**
- New Academic Year can only start **after the latest Academic Period** ends
- Date ranges **must not overlap** with other Academic Years
- Activation is **explicit** (user chooses whether a new year becomes Active)

### 5.1.1 Academic Periods (Configurable)

Academic Periods represent instructional periods within a Tahun Ajaran.

- Tenant-defined (e.g., Semester 1, Semester 2, Trimester, Block A)
- Not limited to Ganjil / Genap
- Each Academic Period has:
  - Name (e.g., "Semester 1")
  - Start date
  - End date
  - Status: Draft, Active, Archived

- Date ranges **must not overlap** within the same Academic Year (including archived periods)
- Each period start date must be **after** the previous period end date
- Period order is derived from the date range (start date, then end date)

- Exactly one Academic Period may be Active at a time
- Activation is **explicit** (user chooses whether a new period becomes Active)
- Used consistently by:
  - Schedules
  - Attendance
  - Assessments
  - Report Cards

### 5.2 Kelas

- Kelas is the **primary academic container**
- No enforced hierarchy (no Tingkat)
- Each Kelas has:
  - Name (e.g., "XI IPA 1")
  - Optional Grade (derived from GRADE Rombongan Belajar)
  - Optional Label (e.g., "1" or "Akselerasi")
  - Academic year

**Wali Kelas Assignment:**

- A Kelas may have **at most one Wali Kelas per academic year**
- Wali Kelas must be a user with the **Guru** role
- Assignment is **time-bounded and year-scoped**
- A Guru may be Wali Kelas for multiple classes (across years or concurrently, depending on school policy)

### 5.3 Rombongan Belajar (Typed, Optional)

Rombongan Belajar provides **flexible, non-hierarchical classification** for classes.

**Rombongan Belajar Properties:**

- Name (e.g., XI, IPA, Unggulan)
- Type (system-defined, extendable):
  - GRADE
  - STREAM
  - PROGRAM
  - CUSTOM

**Rules:**

- Rombongan Belajar is optional
- A class may belong to **at most two** Rombongan Belajar:
  - **Exactly one** GRADE Rombongan Belajar (if grading is used)
  - **At most one** non-GRADE Rombongan Belajar (STREAM, PROGRAM, or CUSTOM)
- The system does not enforce ordering or hierarchy
- GRADE Rombongan Belajar is auto-generated based on Jenjang (e.g., SD 1–6, SMP 7–9, SMA/SMK 10–12)
- Only STREAM, PROGRAM, and CUSTOM are shown in the manual creation list; GRADE is system-managed

### 5.4 Student Enrollment

- Students can move classes **mid-year**
- Class membership must be time-bounded

---

## 6. Mata Pelajaran & Teaching Assignment

### 6.1 Mata Pelajaran

- Global per tenant
- Defined by base subject name (e.g., Matematika)
- Not linked to grade or Rombongan Belajar

### 6.2 Teaching Assignment

- Each **Class–Subject** must have **exactly one assigned Guru**
- Team-teaching is **out of scope for MVP**
- The assigned Guru is responsible for:
  - Attendance
  - Assessment input
  - Descriptive feedback

> This constraint simplifies responsibility, accountability, and rapor generation.

---

### 6.3 Assessment Weights Scope

- Assessment component **weights are defined per ClassSubject + Academic Period**
- This allows:
  - Different weight composition between classes
  - Different weight composition between periods within the same class

**Rules:**

- Total weight per ClassSubject per Academic Period must equal **100%**
- Weights are locked once grading starts

---

## 7. Scheduling & Attendance

### 7.1 Jadwal Pelajaran

- Weekly schedule
- Per kelas
- Includes:
  - Subject
  - Teacher (inferred from teaching assignment)
  - Time slot

**Scheduling Constraints:**

- A teacher **cannot be scheduled in overlapping time slots**, even across different classes
- The system must prevent schedule conflicts at creation time

### 7.2 Session Generation

Session Generation

- Sessions can be created **manually** by Admin Staff (create/edit/delete)
- Teachers can start sessions **from schedule**; session derives class/subject/teacher/period from `scheduleId`
- System prevents duplicate sessions for the same schedule and date
- Teachers may start sessions **outside the scheduled time window**

**Automatic generation (MVP support)**

- System can auto-generate sessions from schedules on a **rolling window** (e.g., next 7 days)
- A **nightly cron** triggers generation for all tenants with an active academic period
- On **schedule create/update**, the system **backfills** sessions for the remaining days in the current window
- Auto-generation is **idempotent** (skips duplicates) and **conflict-aware** (skips time collisions)

### 7.3 Attendance

- Attendance recorded **per subject session**
- Attendance statuses:
  - Hadir
  - Izin
  - Sakit
  - Alpha

---

## 8. Assessment & Grading

### 8.0 Assessment Types

Assessment Types define the **category** of an assessment component (e.g., Assignment/Tugas, Quiz/Ulangan, Midterm/UTS, Final/UAS).

Rules:

- Types are configured **per tenant** and apply to all classes and subjects.
- Types are created from a **default template** and can be renamed or disabled.
- Types **cannot be deleted** once used in any assessment component.

### 8.1 Assessment Components

Assessment weights are defined **per Class–Subject per Academic Period**.

Rules:

- Each Class–Subject combination must define its own assessment components
- Components are scoped to a specific Academic Period
- Weights must total **100% per Class–Subject–Period**
- This allows different weighting strategies between classes or periods

> Example: Matematika XI IPA 1 – Semester 1 may have different weights than Semester 2 or another class.

### 8.2 Nilai Input

Nilai Input

- Guru inputs scores per component
- Editing allowed until locked

---

## 9. Rapor

### 9.1 Rapor Generation

- Generated per semester
- Includes:
  - Numeric score
  - Predikat
  - Descriptive text per subject

### 9.2 Rapor Workflow

1. Guru inputs nilai and deskripsi per subject
2. **Wali Kelas generates and compiles the Rapor** for the class
3. Kepala Sekolah reviews and approves
4. Rapor is locked

> Wali Kelas acts as the academic owner of the class for report generation, not merely a reviewer.

### 9.3 Output

Output

- PDF export

---

## 10. UX Requirements (High-Level)

### Kepala Sekolah

- Academic overview dashboard
- Rapor approval

### Tata Usaha

- Student management
- Class and schedule management

### Guru

- Teaching schedule
- Attendance input
- Grading and rapor descriptions

### Wali Kelas

- Class summary
- Attendance recap
- Rapor compilation

### Siswa

- View schedule
- View attendance
- View grades and rapor

---

## 11. Non-Functional Requirements

### Security

- Strict tenant data isolation
- Role-based access enforcement

### Performance

- Must handle low-bandwidth environments

### Auditability

- Track changes for:
  - Grades
  - Attendance
  - Rapor locks

---

## 12. Success Metrics (MVP)

- Schools can complete one full academic semester digitally
- Rapor can be generated without manual calculation
- Teachers can complete attendance and grading workflows end-to-end

---

## 13. Terminology Mapping (Indonesian ↔ English)

This section defines a **canonical mapping** between Indonesian academic terms used in the UI and their corresponding English terms used in code, database, and APIs.

### 13.1 Core Academic Terms

| Indonesian Term        | English Term (Code) | Notes                      |
| ---------------------- | ------------------- | -------------------------- |
| Tenant                 | Tenant              | One school (one level)     |
| Tahun Ajaran           | AcademicYear        | Exactly one active         |
| Semester               | Semester            | Ganjil / Genap             |
| Kelas                  | Class               | Primary academic container |
| Rombongan Belajar      | Group               | Typed classification       |
| Tipe Rombongan Belajar | GroupType           | GRADE, STREAM, PROGRAM     |
| Wali Kelas             | HomeroomTeacher     | Role assignment            |
| Siswa                  | Student             | Learner                    |
| Guru                   | Teacher             | Teaching staff             |
| Kepala Sekolah         | Principal           | School head                |
| Tata Usaha             | AdminStaff          | Administrative role        |

### 13.2 Teaching & Scheduling

| Indonesian Term  | English Term (Code) | Notes                                         |
| ---------------- | ------------------- | --------------------------------------------- |
| Mata Pelajaran   | Subject             | Base subject name                             |
| Jadwal Pelajaran | Schedule            | Weekly structure                              |
| Sesi             | Session             | Created on start by teacher; admin-manageable |
| Absensi          | Attendance          | Per session                                   |
| Hadir            | Present             | Attendance status                             |
| Izin             | Excused             | Attendance status                             |
| Sakit            | Sick                | Attendance status                             |
| Alpha            | Absent              | Unexcused absence                             |

### 13.3 Assessment & Rapor

| Indonesian Term    | English Term (Code) | Notes               |
| ------------------ | ------------------- | ------------------- |
| Tipe Penilaian     | AssessmentType      | Assessment category |
| Nilai              | Score               | Numeric value       |
| Komponen Penilaian | AssessmentComponent | Weighted            |
| Tugas              | Assignment          | Assessment type     |
| Ulangan            | Quiz                | Assessment type     |
| UTS                | Midterm             | Assessment type     |
| UAS                | FinalExam           | Assessment type     |
| Praktik            | Practical           | Assessment type     |
| Rapor              | ReportCard          | Semester report     |
| Predikat           | GradeLetter         | A/B/C               |
| Deskripsi          | Description         | Narrative feedback  |

### 13.4 System & Control

| Indonesian Term | English Term (Code) | Notes            |
| --------------- | ------------------- | ---------------- |
| Arsip           | Archived            | Read-only state  |
| Aktif           | Active              | Current state    |
| Draft           | Draft               | Editable state   |
| Kunci           | Locked              | No further edits |
| Persetujuan     | Approval            | Review step      |

---

## 13. Future Considerations

- Curriculum Merdeka mapping
- Parent portal
- Foundation-level dashboards
- Hard tenant isolation

---

**End of Document**
