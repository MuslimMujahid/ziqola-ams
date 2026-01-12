# Role-Based Access Control (RBAC)

## Overview

This backend implements a **Hybrid RBAC** system with:

- **Fixed roles** matching the Prisma schema
- **Configurable permissions** with default permission sets per role
- **Global guards** that protect all endpoints by default
- **Tenant isolation** enforced at the data access layer

## Architecture

### Components

1. **Roles** - Fixed user roles in the system
2. **Permissions** - Fine-grained permissions for specific actions
3. **Guards** - NestJS guards that enforce access control
4. **Decorators** - Metadata decorators to mark endpoints

### Guard Execution Order

Guards are applied globally in the following order:

1. **JwtAuthGuard** - Validates JWT token and attaches user to request
2. **RolesGuard** - Checks user role against `@Roles()` decorator
3. **PermissionsGuard** - Checks user permissions against `@RequirePermissions()` decorator

All guards respect the `@Public()` decorator to bypass authentication.

## Roles

As defined in the PRD, the system has four fixed roles:

| Role        | Code               | Indonesian Term | Description                     |
| ----------- | ------------------ | --------------- | ------------------------------- |
| PRINCIPAL   | `Role.PRINCIPAL`   | Kepala Sekolah  | Academic oversight and approval |
| ADMIN_STAFF | `Role.ADMIN_STAFF` | Tata Usaha      | Administrative operations       |
| TEACHER     | `Role.TEACHER`     | Guru            | Teaching staff                  |
| STUDENT     | `Role.STUDENT`     | Siswa           | View-only academic access       |

**Important Notes:**

- Wali Kelas (Homeroom Teacher) is **NOT a role**
- It is a **class-level assignment** given to a Teacher
- A Teacher may be Wali Kelas for multiple classes

## Permissions

The system defines fine-grained permissions grouped by domain:

### User Management

- `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`

### Student Management

- `STUDENT_READ`, `STUDENT_CREATE`, `STUDENT_UPDATE`, `STUDENT_DELETE`, `STUDENT_ENROLL`

### Teacher Management

- `TEACHER_READ`, `TEACHER_CREATE`, `TEACHER_UPDATE`, `TEACHER_DELETE`, `TEACHER_ASSIGN`

### Academic Structure

- `ACADEMIC_YEAR_*`, `CLASS_*`, `SUBJECT_*`, `GROUP_*`, `SCHEDULE_*`

### Teaching Operations

- `ATTENDANCE_*`, `ASSESSMENT_*`, `GRADE_*`

### Report Cards

- `REPORT_CARD_READ`, `REPORT_CARD_GENERATE`, `REPORT_CARD_COMPILE`, `REPORT_CARD_APPROVE`, `REPORT_CARD_LOCK`

### System

- `TENANT_*`, `AUDIT_READ`

See [permission.enum.ts](../src/common/enums/permission.enum.ts) for the complete list.

## Default Permission Sets

Each role has a default set of permissions defined in `DefaultRolePermissions`:

### Principal (Kepala Sekolah)

- Read access to all data
- Academic oversight: activate academic years, approve report cards
- Tenant management

### Admin Staff (Tata Usaha)

- Full CRUD on users, students, teachers
- Full management of academic structure (years, classes, subjects, schedules)
- Read-only access to academic data (attendance, grades, report cards)

### Teacher (Guru)

- View academic structure and schedules
- Record attendance and input grades for assigned classes
- Generate report cards for assigned subjects
- Wali Kelas can compile report cards (context-specific)

### Student (Siswa)

- View-only access to own schedule, attendance, grades, and report cards

## Usage Examples

### 1. Public Endpoints (No Authentication)

```typescript
import { Controller, Post } from "@nestjs/common";
import { Public } from "@/common";

@Controller("auth")
export class AuthController {
  @Public()
  @Post("login")
  login() {
    // Anyone can access this endpoint
  }
}
```

### 2. Role-Based Access

```typescript
import { Controller, Get } from "@nestjs/common";
import { Roles, Role } from "@/common";

@Controller("users")
export class UsersController {
  // Only Principal and Admin Staff can access
  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @Get()
  findAll() {
    // ...
  }

  // Only Teachers can access
  @Roles(Role.TEACHER)
  @Get("teachers")
  findTeachers() {
    // ...
  }
}
```

### 3. Permission-Based Access

```typescript
import { Controller, Post, Delete } from "@nestjs/common";
import { RequirePermissions, Permission } from "@/common";

@Controller("students")
export class StudentsController {
  // Requires both read and create permissions
  @RequirePermissions(Permission.STUDENT_READ, Permission.STUDENT_CREATE)
  @Post()
  create() {
    // Only users with both permissions can access
  }

  // Requires delete permission
  @RequirePermissions(Permission.STUDENT_DELETE)
  @Delete(":id")
  remove() {
    // Only users with delete permission can access
  }
}
```

### 4. Combined Guards

You can combine both decorators for fine-grained control:

```typescript
import { Controller, Post } from "@nestjs/common";
import { Roles, Role, RequirePermissions, Permission } from "@/common";

@Controller("report-cards")
export class ReportCardsController {
  // Must be Principal AND have approval permission
  @Roles(Role.PRINCIPAL)
  @RequirePermissions(Permission.REPORT_CARD_APPROVE)
  @Post(":id/approve")
  approve() {
    // ...
  }
}
```

### 5. Accessing Current User

```typescript
import { Controller, Get } from "@nestjs/common";
import { User } from "@/common";
import { JwtPayload } from "@/auth/strategies/jwt.strategy";

@Controller("profile")
export class ProfileController {
  @Get()
  getProfile(@User() user: JwtPayload) {
    // user contains: { sub, tenantId, email, role }
    return {
      userId: user.sub,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
  }
}
```

## Context-Specific Authorization

For more complex authorization scenarios (e.g., "a teacher can only access their assigned classes"), implement additional checks in your service layer:

```typescript
@Injectable()
export class AttendanceService {
  async recordAttendance(teacherId: string, sessionId: string, data: any) {
    // Check if teacher is assigned to this session's class-subject
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { classSubject: true },
    });

    if (session.classSubject.teacherProfileId !== teacherId) {
      throw new ForbiddenException(
        "You are not assigned to this class-subject"
      );
    }

    // Proceed with recording attendance
  }
}
```

## Tenant Isolation

While RBAC handles role and permission checks, **tenant isolation** must be enforced at the data access layer:

```typescript
@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    // Always scope queries by tenantId
    return this.prisma.studentProfile.findMany({
      where: { tenantId },
    });
  }

  async findOne(tenantId: string, id: string) {
    // Verify tenant access
    return this.prisma.studentProfile.findFirst({
      where: {
        id,
        tenantId, // Critical: prevent cross-tenant access
      },
    });
  }
}
```

**Best Practice:** Extract `tenantId` from the JWT payload in your controllers:

```typescript
@Controller("students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  findAll(@User() user: JwtPayload) {
    return this.students.findAll(user.tenantId);
  }
}
```

## Extending the System

### Adding New Permissions

1. Add the permission to [permission.enum.ts](../src/common/enums/permission.enum.ts):

```typescript
export enum Permission {
  // ... existing
  MY_NEW_PERMISSION = "MY_NEW_PERMISSION",
}
```

2. Update `DefaultRolePermissions` to grant the permission to appropriate roles:

```typescript
export const DefaultRolePermissions: Record<string, Permission[]> = {
  TEACHER: [
    // ... existing permissions
    Permission.MY_NEW_PERMISSION,
  ],
};
```

3. Use the permission in your controller:

```typescript
@RequirePermissions(Permission.MY_NEW_PERMISSION)
@Get("new-feature")
newFeature() {
  // ...
}
```

### Future: Database-Driven Permissions

The current implementation uses `DefaultRolePermissions` for simplicity. In the future, you can:

1. Store custom permissions in the database (e.g., `RolePermission` table)
2. Update `PermissionsGuard.getUserPermissions()` to query the database
3. Provide a UI for admins to customize role permissions

## Testing

Example test for role-based access:

```typescript
describe("UsersController (e2e)", () => {
  it("should deny access without JWT", () => {
    return request(app.getHttpServer()).get("/users").expect(401);
  });

  it("should deny access for Student role", () => {
    const token = generateToken({ role: Role.STUDENT });
    return request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("should allow access for Admin Staff", () => {
    const token = generateToken({ role: Role.ADMIN_STAFF });
    return request(app.getHttpServer())
      .get("/users")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
```

## Security Considerations

1. **JWT Secret**: Use a strong, randomly generated secret in production
2. **Token Expiration**: Configure appropriate expiration times
3. **HTTPS**: Always use HTTPS in production
4. **Tenant Isolation**: Double-check all queries include `tenantId`
5. **Audit Logging**: Log all sensitive operations (grades, attendance, report cards)
6. **Rate Limiting**: Implement rate limiting for authentication endpoints

## References

- [PRD - Section 4: User Roles & Permissions](../../docs/PRD-v1.0.md#4-user-roles--permissions)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [Passport JWT Strategy](https://www.passportjs.org/packages/passport-jwt/)
