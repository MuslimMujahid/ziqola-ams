import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  successResponse,
} from "../common";
import { AssessmentRecapService } from "./assessment-recap.service";
import {
  ListAssessmentRecapDto,
  RequestAssessmentRecapChangeDto,
  SubmitAssessmentRecapDto,
  UpdateAssessmentRecapKkmDto,
} from "./dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("assessment-recap")
export class AssessmentRecapController {
  constructor(private readonly service: AssessmentRecapService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get()
  async getRecap(
    @Query() query: ListAssessmentRecapDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.getTeacherRecap(user.tenantId, query, user);
    return successResponse(data, "Assessment recap retrieved", 200);
  }

  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.GRADE_LOCK)
  @Post("submit")
  async submitRecap(
    @Body() body: SubmitAssessmentRecapDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.submitTeacherRecap(
      user.tenantId,
      body,
      user,
    );
    return successResponse(data, "Assessment recap submitted", 200);
  }

  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.GRADE_UPDATE)
  @Post("change-requests")
  async requestScoreChange(
    @Body() body: RequestAssessmentRecapChangeDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.requestTeacherRecapChange(
      user.tenantId,
      body,
      user,
    );
    return successResponse(data, "Change request submitted", 200);
  }

  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_CONFIGURE)
  @Patch("kkm")
  async updateKkm(
    @Body() body: UpdateAssessmentRecapKkmDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.updateTeacherRecapKkm(
      user.tenantId,
      body,
      user,
    );
    return successResponse(data, "KKM updated", 200);
  }
}
