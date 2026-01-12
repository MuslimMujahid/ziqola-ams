# RBAC Quick Reference

## Decorators

### `@Public()`

Mark an endpoint as public (no authentication required).

```typescript
@Public()
@Post("login")
login() { ... }
```

### `@Roles(...roles)`

Restrict access to specific roles. User must have **one of** the specified roles.

```typescript
@Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
@Get("admin-data")
getAdminData() { ... }
```

### `@RequirePermissions(...permissions)`

Restrict access to specific permissions. User must have **all** specified permissions.

```typescript
@RequirePermissions(Permission.STUDENT_CREATE)
@Post("students")
createStudent() { ... }
```

### `@User()`

Get the current authenticated user from JWT payload.

```typescript
@Get("profile")
getProfile(@User() user: JwtPayload) {
  return user; // { sub, tenantId, email, role }
}
```

## Roles

- `Role.PRINCIPAL` - Kepala Sekolah
- `Role.ADMIN_STAFF` - Tata Usaha
- `Role.TEACHER` - Guru
- `Role.STUDENT` - Siswa

## Common Permissions

### User Management

- `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`

### Student Management

- `STUDENT_READ`, `STUDENT_CREATE`, `STUDENT_UPDATE`, `STUDENT_DELETE`

### Teacher Management

- `TEACHER_READ`, `TEACHER_CREATE`, `TEACHER_UPDATE`, `TEACHER_DELETE`

### Academic Operations

- `CLASS_*`, `SUBJECT_*`, `SCHEDULE_*`
- `ATTENDANCE_*`, `GRADE_*`
- `REPORT_CARD_*`

See [permission.enum.ts](../src/common/enums/permission.enum.ts) for complete list.

## Usage Patterns

### Public endpoint

```typescript
@Public()
@Post("login")
```

### Role-based

```typescript
@Roles(Role.TEACHER)
@Get("my-classes")
```

### Permission-based

```typescript
@RequirePermissions(Permission.GRADE_INPUT)
@Post("grades")
```

### Combined

```typescript
@Roles(Role.PRINCIPAL)
@RequirePermissions(Permission.REPORT_CARD_APPROVE)
@Post("approve")
```

### Tenant isolation

```typescript
@Get("students")
getStudents(@User() user: JwtPayload) {
  return this.service.findAll(user.tenantId);
}
```

## Important Notes

1. All endpoints are **protected by default** (JWT required)
2. Use `@Public()` to opt-out of authentication
3. Guards execute in order: **JWT → Roles → Permissions**
4. Always scope data queries by `tenantId`
5. **Wali Kelas is NOT a role** - check `HomeroomAssignment` in service layer

## Full Documentation

See [docs/rbac.md](../docs/rbac.md) for comprehensive documentation.
