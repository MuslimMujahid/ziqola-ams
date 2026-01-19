import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  successResponse,
} from "../common";
import { EnrollmentsService } from "./enrollments.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { UpdateEnrollmentDto } from "./dto/update-enrollment.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.STUDENT_ENROLL)
  @Post()
  async createEnrollment(
    @Body() dto: CreateEnrollmentDto,
    @UserDecorator() user: JwtUser,
  ) {
    const enrollment = await this.enrollments.createEnrollment(
      user.tenantId,
      dto,
    );
    return successResponse(enrollment, "Enrollment created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.STUDENT_ENROLL)
  @Patch(":id")
  async updateEnrollment(
    @Param("id") id: string,
    @Body() dto: UpdateEnrollmentDto,
    @UserDecorator() user: JwtUser,
  ) {
    const enrollment = await this.enrollments.updateEnrollment(
      user.tenantId,
      id,
      dto,
    );
    return successResponse(enrollment, "Enrollment updated", 200);
  }
}
