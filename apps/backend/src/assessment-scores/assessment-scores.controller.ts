import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  successResponse,
} from "../common";
import { AssessmentScoresService } from "./assessment-scores.service";
import { ListAssessmentScoresDto, UpsertAssessmentScoresDto } from "./dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("assessment-scores")
export class AssessmentScoresController {
  constructor(private readonly service: AssessmentScoresService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get()
  async listScores(
    @Query() query: ListAssessmentScoresDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.listScores(user.tenantId, query, user);
    return successResponse(data, "Assessment scores retrieved", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_CONFIGURE)
  @Put()
  async upsertScores(
    @Body() dto: UpsertAssessmentScoresDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.upsertScores(user.tenantId, dto, user);
    return successResponse(data, "Assessment scores saved", 200);
  }
}
