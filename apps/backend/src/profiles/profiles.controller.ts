import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { CreateTeacherProfileDto } from "./dto/create-teacher-profile.dto";
import { UpdateTeacherProfileDto } from "./dto/update-teacher-profile.dto";
import { CreateStudentProfileDto } from "./dto/create-student-profile.dto";
import { UpdateStudentProfileDto } from "./dto/update-student-profile.dto";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  successResponse,
  User as UserDecorator,
} from "../common";

interface JwtUser {
  sub: string;
  tenantId: string;
  email: string;
  role: Role;
}

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.TEACHER_CREATE)
  @Post("teacher")
  async createTeacher(
    @Body() dto: CreateTeacherProfileDto,
    @UserDecorator() user: JwtUser
  ) {
    const profile = await this.profiles.createTeacherProfile(
      user.tenantId,
      dto
    );
    return successResponse(
      profile,
      "Teacher profile created successfully",
      201
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.TEACHER_READ)
  @Get("teacher/:id")
  async findTeacherById(
    @Param("id") id: string,
    @UserDecorator() user: JwtUser
  ) {
    const profile = await this.profiles.findTeacherProfileById(
      user.tenantId,
      id
    );

    if (user.role === Role.TEACHER && profile.userId !== user.sub) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return successResponse(
      profile,
      "Teacher profile retrieved successfully",
      200
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.TEACHER_READ)
  @Get("teacher/user/:userId")
  async findTeacherByUserId(
    @Param("userId") userId: string,
    @UserDecorator() user: JwtUser
  ) {
    if (user.role === Role.TEACHER && userId !== user.sub) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const profile = await this.profiles.findTeacherProfileByUserId(
      user.tenantId,
      userId
    );

    return successResponse(
      profile,
      "Teacher profile retrieved successfully",
      200
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.TEACHER_UPDATE)
  @Patch("teacher/:id")
  async updateTeacher(
    @Param("id") id: string,
    @Body() dto: UpdateTeacherProfileDto,
    @UserDecorator() user: JwtUser
  ) {
    const profile = await this.profiles.updateTeacherProfile(
      user.tenantId,
      id,
      dto
    );

    return successResponse(
      profile,
      "Teacher profile updated successfully",
      200
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.STUDENT_CREATE)
  @Post("student")
  async createStudent(
    @Body() dto: CreateStudentProfileDto,
    @UserDecorator() user: JwtUser
  ) {
    const profile = await this.profiles.createStudentProfile(
      user.tenantId,
      dto
    );
    return successResponse(
      profile,
      "Student profile created successfully",
      201
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.STUDENT)
  @RequirePermissions(Permission.STUDENT_READ)
  @Get("student/:id")
  async findStudentById(
    @Param("id") id: string,
    @UserDecorator() user: JwtUser
  ) {
    const profile = await this.profiles.findStudentProfileById(
      user.tenantId,
      id
    );

    if (user.role === Role.STUDENT && profile.userId !== user.sub) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return successResponse(
      profile,
      "Student profile retrieved successfully",
      200
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.STUDENT)
  @RequirePermissions(Permission.STUDENT_READ)
  @Get("student/user/:userId")
  async findStudentByUserId(
    @Param("userId") userId: string,
    @UserDecorator() user: JwtUser
  ) {
    if (user.role === Role.STUDENT && userId !== user.sub) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const profile = await this.profiles.findStudentProfileByUserId(
      user.tenantId,
      userId
    );

    return successResponse(
      profile,
      "Student profile retrieved successfully",
      200
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.STUDENT_UPDATE)
  @Patch("student/:id")
  async updateStudent(
    @Param("id") id: string,
    @Body() dto: UpdateStudentProfileDto,
    @UserDecorator() user: JwtUser
  ) {
    const profile = await this.profiles.updateStudentProfile(
      user.tenantId,
      id,
      dto
    );

    return successResponse(
      profile,
      "Student profile updated successfully",
      200
    );
  }
}
