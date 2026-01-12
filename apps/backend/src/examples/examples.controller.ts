import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { Roles, Role, RequirePermissions, Permission, User } from "../common";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";

/**
 * Example controller demonstrating RBAC usage
 *
 * This controller shows various patterns for:
 * - Role-based access control
 * - Permission-based access control
 * - Accessing current user
 * - Tenant isolation
 */
@Controller("examples")
export class ExamplesController {
  // =============================
  // Role-Based Access Examples
  // =============================

  /**
   * Only Principal and Admin Staff can access
   */
  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @Get("admin-only")
  adminOnly() {
    return { message: "Only admins can see this" };
  }

  /**
   * Only Teachers can access
   */
  @Roles(Role.TEACHER)
  @Get("teachers-only")
  teachersOnly() {
    return { message: "Only teachers can see this" };
  }

  /**
   * Any authenticated user can access (no role restriction)
   */
  @Get("authenticated")
  authenticated(@User() user: JwtPayload) {
    return {
      message: "Any authenticated user can see this",
      user: {
        id: user.sub,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  // =============================
  // Permission-Based Access Examples
  // =============================

  /**
   * Requires specific permission(s)
   * User must have ALL specified permissions
   */
  @RequirePermissions(Permission.STUDENT_CREATE)
  @Post("students")
  createStudent(@Body() data: any) {
    return { message: "Student created", data };
  }

  /**
   * Multiple permissions required
   */
  @RequirePermissions(Permission.STUDENT_READ, Permission.STUDENT_UPDATE)
  @Put("students/:id")
  updateStudent(@Param("id") id: string, @Body() data: any) {
    return { message: "Student updated", id, data };
  }

  /**
   * Delete requires specific permission
   */
  @RequirePermissions(Permission.STUDENT_DELETE)
  @Delete("students/:id")
  deleteStudent(@Param("id") id: string) {
    return { message: "Student deleted", id };
  }

  // =============================
  // Combined Role + Permission Examples
  // =============================

  /**
   * Must be Principal AND have approval permission
   * Both guards must pass
   */
  @Roles(Role.PRINCIPAL)
  @RequirePermissions(Permission.REPORT_CARD_APPROVE)
  @Post("report-cards/:id/approve")
  approveReportCard(@Param("id") id: string, @User() user: JwtPayload) {
    return {
      message: "Report card approved",
      id,
      approvedBy: user.sub,
    };
  }

  // =============================
  // Tenant Isolation Example
  // =============================

  /**
   * Demonstrates proper tenant isolation
   * Always scope data access by tenantId from JWT
   */
  @RequirePermissions(Permission.STUDENT_READ)
  @Get("my-tenant-students")
  getMyTenantStudents(@User() user: JwtPayload) {
    // In a real service, you would:
    // return this.studentsService.findAll(user.tenantId);

    return {
      message: "Students scoped to your tenant",
      tenantId: user.tenantId,
      note: "Always pass tenantId to your service methods",
    };
  }

  // =============================
  // Context-Specific Authorization
  // =============================

  /**
   * Example of context-specific check
   * Teacher can only access their assigned classes
   */
  @Roles(Role.TEACHER)
  @Get("my-classes")
  getMyClasses(@User() user: JwtPayload) {
    // In a real service:
    // 1. Get teacher profile by user.sub
    // 2. Query ClassSubject where teacherProfileId = profile.id
    // 3. Always scope by tenantId

    return {
      message: "Classes assigned to this teacher",
      userId: user.sub,
      tenantId: user.tenantId,
      note: "Filter by teacher assignment in service layer",
    };
  }

  // =============================
  // Homeroom Teacher (Wali Kelas) Example
  // =============================

  /**
   * Wali Kelas compile report cards
   * Note: Wali Kelas is NOT a role, it's a class-level assignment
   * This must be checked in the service layer
   */
  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.REPORT_CARD_COMPILE)
  @Post("report-cards/:classId/compile")
  compileReportCard(
    @Param("classId") classId: string,
    @User() user: JwtPayload
  ) {
    // In a real service:
    // 1. Get teacher profile by user.sub
    // 2. Check HomeroomAssignment where:
    //    - classId = classId
    //    - teacherProfileId = profile.id
    //    - isActive = true
    // 3. If no active assignment, throw ForbiddenException
    // 4. Proceed with compilation

    return {
      message: "Report card compilation initiated",
      classId,
      compiledBy: user.sub,
      note: "Verify Wali Kelas assignment in service layer",
    };
  }
}
