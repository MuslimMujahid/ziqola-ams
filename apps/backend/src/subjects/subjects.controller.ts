import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  paginatedResponse,
  successResponse,
} from "../common";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { SubjectQueryDto } from "./dto/subject-query.dto";
import { SubjectsService } from "./subjects.service";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("subjects")
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_READ)
  @Get()
  async listSubjects(
    @Query() query: SubjectQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.subjects.getSubjects(user.tenantId, query);

    return paginatedResponse(
      result.data,
      { ...query, total: result.total },
      "Subjects retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_CREATE)
  @Post()
  async createSubject(
    @Body() dto: CreateSubjectDto,
    @UserDecorator() user: JwtUser,
  ) {
    const subject = await this.subjects.createSubject(user.tenantId, dto);
    return successResponse(subject, "Subject created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_UPDATE)
  @Patch(":id")
  async updateSubject(
    @Param("id") id: string,
    @Body() dto: UpdateSubjectDto,
    @UserDecorator() user: JwtUser,
  ) {
    const subject = await this.subjects.updateSubject(user.tenantId, id, dto);
    return successResponse(subject, "Subject updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_DELETE)
  @Delete(":id")
  async deleteSubject(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const result = await this.subjects.deleteSubject(user.tenantId, id);
    return successResponse(result, "Subject deleted", 200);
  }
}
