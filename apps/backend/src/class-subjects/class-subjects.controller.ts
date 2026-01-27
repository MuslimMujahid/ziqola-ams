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
import { ClassSubjectsService } from "./class-subjects.service";
import { ClassSubjectQueryDto } from "./dto/class-subject-query.dto";
import { CreateClassSubjectDto } from "./dto/create-class-subject.dto";
import { ListTeacherSubjectsDto } from "./dto/list-teacher-subjects.dto";
import { UpdateClassSubjectDto } from "./dto/update-class-subject.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("class-subjects")
export class ClassSubjectsController {
  constructor(private readonly classSubjects: ClassSubjectsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.SUBJECT_READ)
  @Get()
  async listClassSubjects(
    @Query() query: ClassSubjectQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const effectiveQuery = { ...query };

    if (user.role === Role.TEACHER) {
      const teacherProfileId =
        await this.classSubjects.getTeacherProfileIdByUser(
          user.tenantId,
          user.sub,
        );
      effectiveQuery.teacherProfileId = teacherProfileId;
    }

    const result = await this.classSubjects.getClassSubjects(
      user.tenantId,
      effectiveQuery,
    );

    return paginatedResponse(
      result.data,
      { ...query, total: result.total },
      "Class subjects retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.SUBJECT_READ)
  @Get("teacher-subjects")
  async listTeacherSubjects(
    @Query() query: ListTeacherSubjectsDto,
    @UserDecorator() user: JwtUser,
  ) {
    const effectiveQuery = { ...query };

    if (user.role === Role.TEACHER) {
      const teacherProfileId =
        await this.classSubjects.getTeacherProfileIdByUser(
          user.tenantId,
          user.sub,
        );
      effectiveQuery.teacherProfileId = teacherProfileId;
    }

    const result = await this.classSubjects.listTeacherSubjects(
      user.tenantId,
      effectiveQuery,
    );

    return successResponse(result, "Teacher subjects retrieved", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_ASSIGN)
  @Post()
  async createClassSubject(
    @Body() dto: CreateClassSubjectDto,
    @UserDecorator() user: JwtUser,
  ) {
    const assignment = await this.classSubjects.createClassSubject(
      user.tenantId,
      dto,
    );
    return successResponse(assignment, "Class subject created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_ASSIGN)
  @Patch(":id")
  async updateClassSubject(
    @Param("id") id: string,
    @Body() dto: UpdateClassSubjectDto,
    @UserDecorator() user: JwtUser,
  ) {
    const assignment = await this.classSubjects.updateClassSubject(
      user.tenantId,
      id,
      dto,
    );
    return successResponse(assignment, "Class subject updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SUBJECT_ASSIGN)
  @Delete(":id")
  async deleteClassSubject(
    @Param("id") id: string,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.classSubjects.deleteClassSubject(
      user.tenantId,
      id,
    );
    return successResponse(result, "Class subject deleted", 200);
  }
}
