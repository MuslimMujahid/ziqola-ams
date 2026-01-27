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
import { AcademicService } from "./academic.service";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  successResponse,
  paginatedResponse,
} from "../common";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { CreateAcademicPeriodDto } from "./dto/create-academic-period.dto";
import { CreateAcademicSetupDto } from "./dto/create-academic-setup.dto";
import { CreateAcademicOnboardingDto } from "./dto/create-academic-onboarding.dto";
import { AcademicYearQueryDto } from "./dto/academic-year-query.dto";
import { UpdateAcademicYearDto } from "./dto/update-academic-year.dto";
import { AcademicPeriodQueryDto } from "./dto/academic-period-query.dto";
import { UpdateAcademicPeriodDto } from "./dto/update-academic-period.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("academic")
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ACADEMIC_YEAR_READ)
  @Get("context")
  async getContext(@UserDecorator() user: JwtUser) {
    const result = await this.academic.getContext(user.tenantId);
    return successResponse(result, "Academic context retrieved", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_YEAR_READ)
  @Get("years")
  async listYears(
    @Query() query: AcademicYearQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.getAcademicYears(user.tenantId, query);
    return paginatedResponse(
      result.data,
      { ...query, total: result.total, sort: "createdAt" },
      "Academic years retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_PERIOD_READ)
  @Get("periods")
  async listPeriods(
    @Query() query: AcademicPeriodQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.getAcademicPeriods(user.tenantId, query);
    return paginatedResponse(
      result.data,
      { ...query, total: result.total, sort: "startDate" },
      "Academic periods retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_YEAR_CREATE)
  @Post("years")
  async createYear(
    @Body() dto: CreateAcademicYearDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.createAcademicYear(user.tenantId, dto);
    return successResponse(result, "Academic year created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_YEAR_UPDATE)
  @Patch("years/:id")
  async updateYear(
    @Param("id") id: string,
    @Body() dto: UpdateAcademicYearDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.updateAcademicYear(
      user.tenantId,
      id,
      dto,
    );
    return successResponse(result, "Academic year updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_YEAR_ACTIVATE)
  @Post("years/:id/activate")
  async activateYear(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const result = await this.academic.activateAcademicYear(user.tenantId, id);
    return successResponse(result, "Academic year activated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_YEAR_DELETE)
  @Delete("years/:id")
  async deleteYear(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const result = await this.academic.deleteAcademicYear(user.tenantId, id);
    return successResponse(result, "Academic year deleted", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_PERIOD_CREATE)
  @Post("periods")
  async createPeriod(
    @Body() dto: CreateAcademicPeriodDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.createAcademicPeriod(user.tenantId, dto);
    return successResponse(result, "Academic period created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_PERIOD_UPDATE)
  @Patch("periods/:id")
  async updatePeriod(
    @Param("id") id: string,
    @Body() dto: UpdateAcademicPeriodDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.updateAcademicPeriod(
      user.tenantId,
      id,
      dto,
    );
    return successResponse(result, "Academic period updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_PERIOD_ACTIVATE)
  @Post("periods/:id/activate")
  async activatePeriod(
    @Param("id") id: string,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.activateAcademicPeriod(
      user.tenantId,
      id,
    );
    return successResponse(result, "Academic period activated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(
    Permission.ACADEMIC_YEAR_CREATE,
    Permission.ACADEMIC_PERIOD_CREATE,
  )
  @Post("setup")
  async createSetup(
    @Body() dto: CreateAcademicSetupDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.createAcademicSetup(user.tenantId, dto);
    return successResponse(result, "Academic setup created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(
    Permission.ACADEMIC_YEAR_CREATE,
    Permission.ACADEMIC_PERIOD_CREATE,
  )
  @Post("onboarding")
  async createOnboarding(
    @Body() dto: CreateAcademicOnboardingDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.academic.createAcademicOnboarding(
      user.tenantId,
      dto,
    );
    return successResponse(result, "Academic onboarding completed", 201);
  }
}
