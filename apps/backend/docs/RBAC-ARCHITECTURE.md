# RBAC System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
│                    Authorization: Bearer <JWT>                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS Application                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Global Guards (Ordered)                │ │
│  │                                                           │ │
│  │  1️⃣  JwtAuthGuard                                         │ │
│  │      ├─ Check @Public() → Allow if true                  │ │
│  │      ├─ Validate JWT token                               │ │
│  │      └─ Attach user to request                           │ │
│  │         { sub, tenantId, email, role }                   │ │
│  │                                                           │ │
│  │  2️⃣  RolesGuard                                           │ │
│  │      ├─ Check @Public() → Allow if true                  │ │
│  │      ├─ Check @Roles() decorator                         │ │
│  │      ├─ No roles specified? → Allow                      │ │
│  │      └─ User role in required roles? → Allow/Deny        │ │
│  │                                                           │ │
│  │  3️⃣  PermissionsGuard                                     │ │
│  │      ├─ Check @Public() → Allow if true                  │ │
│  │      ├─ Check @RequirePermissions() decorator            │ │
│  │      ├─ No permissions specified? → Allow                │ │
│  │      ├─ Resolve permissions from DefaultRolePermissions  │ │
│  │      └─ User has ALL required permissions? → Allow/Deny  │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                       Controller                          │ │
│  │                                                           │ │
│  │  @Roles(Role.TEACHER)                                    │ │
│  │  @RequirePermissions(Permission.GRADE_INPUT)             │ │
│  │  @Post('grades')                                         │ │
│  │  createGrade(@User() user, @Body() data) {              │ │
│  │    return this.service.create(data, user.tenantId);     │ │
│  │  }                                                       │ │
│  │                                                           │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │                                       │
│                         ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                       Service Layer                       │ │
│  │                                                           │ │
│  │  async create(data, tenantId) {                          │ │
│  │    // ⚠️ CRITICAL: Always scope by tenantId              │ │
│  │    return this.prisma.grade.create({                     │ │
│  │      data: { ...data, tenantId }                         │ │
│  │    });                                                   │ │
│  │  }                                                       │ │
│  │                                                           │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │   Database (Postgres)    │
            │    + Tenant Isolation    │
            └──────────────────────────┘
```

## Role Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Roles                                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    PRINCIPAL     │  Academic oversight and approval
│ (Kepala Sekolah) │
├──────────────────┤  Permissions:
│ 🔍 READ ALL      │  ✅ All read permissions
│ ✔️ APPROVE       │  ✅ Approve report cards
│ 🔧 CONFIGURE     │  ✅ Activate academic years
└──────────────────┘  ✅ Tenant configuration

┌──────────────────┐
│   ADMIN_STAFF    │  Administrative operations
│   (Tata Usaha)   │
├──────────────────┤  Permissions:
│ 👥 FULL CRUD     │  ✅ Manage users/students/teachers
│ 📚 STRUCTURE     │  ✅ Manage classes/subjects/schedules
│ 🔍 READ ACADEMIC │  ✅ View grades/attendance (read-only)
└──────────────────┘  ✅ Configure academic structure

┌──────────────────┐
│     TEACHER      │  Teaching staff
│      (Guru)      │
├──────────────────┤  Permissions:
│ 📝 ATTENDANCE    │  ✅ Record/update attendance (assigned classes)
│ 📊 GRADING       │  ✅ Input/update grades (assigned subjects)
│ 📄 REPORT CARDS  │  ✅ Generate subject reports
│ 👁️ VIEW ACADEMIC │  ✅ View structure/schedules
└──────────────────┘  ✅ Compile reports (if Wali Kelas)

┌──────────────────┐
│     STUDENT      │  Learner (view-only)
│      (Siswa)     │
├──────────────────┤  Permissions:
│ 👁️ VIEW ONLY     │  ✅ View own schedule
│                  │  ✅ View own attendance
│                  │  ✅ View own grades
└──────────────────┘  ✅ View own report cards
```

## Permission Groups

```
┌─────────────────────────────────────────────────────────────┐
│                    Permission Categories                    │
└─────────────────────────────────────────────────────────────┘

🧑‍💼 USER MANAGEMENT          👥 STUDENT MANAGEMENT
   • USER_READ                 • STUDENT_READ
   • USER_CREATE               • STUDENT_CREATE
   • USER_UPDATE               • STUDENT_UPDATE
   • USER_DELETE               • STUDENT_DELETE
                               • STUDENT_ENROLL

🧑‍🏫 TEACHER MANAGEMENT       📅 ACADEMIC STRUCTURE
   • TEACHER_READ              • ACADEMIC_YEAR_*
   • TEACHER_CREATE            • CLASS_*
   • TEACHER_UPDATE            • SUBJECT_*
   • TEACHER_DELETE            • GROUP_*
   • TEACHER_ASSIGN            • SCHEDULE_*

✅ ATTENDANCE                 📊 ASSESSMENT & GRADING
   • ATTENDANCE_READ           • ASSESSMENT_*
   • ATTENDANCE_RECORD         • GRADE_READ
   • ATTENDANCE_UPDATE         • GRADE_INPUT
   • ATTENDANCE_READ_ALL       • GRADE_UPDATE
                               • GRADE_LOCK
                               • GRADE_READ_ALL

📄 REPORT CARDS               🔧 SYSTEM
   • REPORT_CARD_READ          • TENANT_READ
   • REPORT_CARD_GENERATE      • TENANT_UPDATE
   • REPORT_CARD_COMPILE       • AUDIT_READ
   • REPORT_CARD_APPROVE
   • REPORT_CARD_LOCK
   • REPORT_CARD_READ_ALL
```

## Decorator Usage Patterns

```typescript
// ════════════════════════════════════════════════════════════
//                   PATTERN 1: Public Endpoint
// ════════════════════════════════════════════════════════════
@Public()
@Post('login')
login(@Body() dto: LoginDto) {
  // ✅ No authentication required
}

// ════════════════════════════════════════════════════════════
//              PATTERN 2: Role-Based (OR Logic)
// ════════════════════════════════════════════════════════════
@Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
@Get('admin-data')
getAdminData() {
  // ✅ PRINCIPAL can access
  // ✅ ADMIN_STAFF can access
  // ❌ TEACHER cannot access
  // ❌ STUDENT cannot access
}

// ════════════════════════════════════════════════════════════
//           PATTERN 3: Permission-Based (AND Logic)
// ════════════════════════════════════════════════════════════
@RequirePermissions(Permission.STUDENT_READ, Permission.STUDENT_CREATE)
@Post('students')
createStudent(@Body() data: CreateStudentDto) {
  // ✅ Must have BOTH permissions
  // ❌ Having only one is not enough
}

// ════════════════════════════════════════════════════════════
//              PATTERN 4: Combined (Role + Permission)
// ════════════════════════════════════════════════════════════
@Roles(Role.PRINCIPAL)
@RequirePermissions(Permission.REPORT_CARD_APPROVE)
@Post('report-cards/:id/approve')
approveReportCard(@Param('id') id: string) {
  // ✅ Must be PRINCIPAL
  // ✅ AND have REPORT_CARD_APPROVE permission
}

// ════════════════════════════════════════════════════════════
//              PATTERN 5: Context-Specific Check
// ════════════════════════════════════════════════════════════
@Roles(Role.TEACHER)
@Post('attendance')
recordAttendance(@User() user: JwtPayload, @Body() data: any) {
  // ✅ RBAC checks role
  // ⚠️ Service layer checks if teacher is assigned to this session
  return this.service.record(user.sub, user.tenantId, data);
}
```

## Data Flow Example: Creating a Grade

```
1️⃣  Client Request
    POST /grades
    Authorization: Bearer eyJhbGc...
    Body: { studentId: "abc", score: 85, ... }

2️⃣  JwtAuthGuard
    ✓ Token valid
    ✓ User extracted: { sub: "teacher-123", role: "TEACHER", tenantId: "school-456" }
    ✓ Attached to request

3️⃣  RolesGuard
    @Roles(Role.TEACHER) specified?
    ✓ User role = TEACHER
    ✓ TEACHER in [Role.TEACHER]
    ✓ Access granted

4️⃣  PermissionsGuard
    @RequirePermissions(Permission.GRADE_INPUT) specified?
    ✓ User role = TEACHER
    ✓ DefaultRolePermissions[TEACHER] includes GRADE_INPUT
    ✓ Access granted

5️⃣  Controller
    createGrade(@User() user, @Body() data) {
      return this.gradesService.create(data, user.tenantId);
    }

6️⃣  Service Layer
    async create(data, tenantId) {
      // ⚠️ Additional checks here:
      // - Is teacher assigned to this class-subject?
      // - Is grading period open?
      // - Are scores locked?

      return this.prisma.assessmentScore.create({
        data: {
          ...data,
          tenantId, // ⚠️ CRITICAL: Tenant isolation
        }
      });
    }

7️⃣  Database
    INSERT INTO assessment_scores (id, tenant_id, student_id, score, ...)
    WHERE tenant_id = 'school-456'
```

## Tenant Isolation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Tenant Architecture                │
└─────────────────────────────────────────────────────────────┘

JWT Payload:
{
  sub: "user-id",
  tenantId: "tenant-id",  ← Tenant identifier
  email: "user@example.com",
  role: "TEACHER"
}

Every Database Query MUST Include tenantId:
┌─────────────────────────────────────────────────────────────┐
│ ✅ CORRECT                   │ ❌ WRONG                      │
├─────────────────────────────────────────────────────────────┤
│ findMany({                   │ findMany({                   │
│   where: { tenantId }        │   // Missing tenantId!       │
│ })                           │ })                           │
│                              │                              │
│ findFirst({                  │ findUnique({                 │
│   where: {                   │   where: { id }              │
│     id,                      │   // Cross-tenant leak!      │
│     tenantId                 │ })                           │
│   }                          │                              │
│ })                           │                              │
└─────────────────────────────────────────────────────────────┘

Service Pattern:
async findAll(tenantId: string) {
  return this.prisma.student.findMany({
    where: { tenantId }  // ← Always scope
  });
}

async findOne(tenantId: string, id: string) {
  const record = await this.prisma.student.findFirst({
    where: { id, tenantId }  // ← Verify ownership
  });

  if (!record) {
    throw new NotFoundException(); // Could be: not found OR wrong tenant
  }

  return record;
}
```

## Security Checklist

```
✅ JWT Secret Configuration
   • Use strong random secret in production
   • Store in environment variables
   • Rotate periodically

✅ Token Expiration
   • Configure appropriate expiration (e.g., 1 day)
   • Implement refresh token flow (Phase 2)

✅ HTTPS Only
   • Enforce HTTPS in production
   • No JWT transmission over HTTP

✅ Tenant Isolation
   • ALWAYS include tenantId in queries
   • Validate tenant access in service layer
   • Test cross-tenant access scenarios

✅ Rate Limiting
   • Implement rate limiting on auth endpoints
   • Prevent brute force attacks

✅ Audit Logging
   • Log sensitive operations (grades, attendance, approvals)
   • Include actor, action, timestamp, metadata

✅ Input Validation
   • Validate all DTOs with class-validator
   • Sanitize user inputs
   • Prevent SQL injection (Prisma handles this)

✅ Error Messages
   • Don't leak sensitive information
   • Use generic messages for auth failures
   • Log detailed errors server-side

✅ CORS Configuration
   • Restrict allowed origins
   • Configure appropriate headers

✅ CSP Headers
   • Implement Content Security Policy
   • Prevent XSS attacks
```

## Quick Reference Commands

```bash
# Build and verify
pnpm --filter backend build

# Run in development
pnpm --filter backend dev

# Run tests
pnpm --filter backend test
pnpm --filter backend test:e2e

# Database operations
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate
```

## Next Steps

```
Phase 1 (MVP):
  [✅] RBAC implementation
  [ ] Implement core domain controllers (users, students, teachers)
  [ ] Add E2E tests for RBAC flows
  [ ] Implement audit logging
  [ ] Add rate limiting

Phase 2 (Enhancements):
  [ ] Database-driven permissions
  [ ] Permission management UI
  [ ] Resource-based authorization (CASL)
  [ ] Permission caching (Redis)
  [ ] Advanced audit dashboard
```

---

**For detailed implementation guide, see**: [docs/rbac.md](./rbac.md)  
**For quick reference, see**: [docs/RBAC-QUICK-REFERENCE.md](./RBAC-QUICK-REFERENCE.md)  
**For examples, see**: [src/examples/examples.controller.ts](../src/examples/examples.controller.ts)
