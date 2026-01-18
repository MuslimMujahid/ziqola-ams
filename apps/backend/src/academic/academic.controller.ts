import { Body, Controller, Get, Post } from "@nestjs/common";
import { AcademicService } from "./academic.service";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  successResponse,
} from "../common";
import { CreateAcademicYearDto } from "./dto/create-academic-year.dto";
import { CreateAcademicPeriodDto } from "./dto/create-academic-period.dto";
import { CreateAcademicSetupDto } from "./dto/create-academic-setup.dto";
import { CreateAcademicOnboardingDto } from "./dto/create-academic-onboarding.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("academic")
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.ACADEMIC_YEAR_READ)
  @Get("context")
  async getContext(@UserDecorator() user: JwtUser) {
    const result = await this.academic.getContext(user.tenantId);
    return successResponse(result, "Academic context retrieved", 200);
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
