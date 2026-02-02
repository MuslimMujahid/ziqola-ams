import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  successResponse,
} from "../common";
import { AssessmentRecapService } from "./assessment-recap.service";
import {
  ListAssessmentRecapDto,
  ListHomeroomAssessmentRecapDto,
  DecideAssessmentRecapChangeDto,
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
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get("homeroom")
  async getHomeroomRecaps(
    @Query() query: ListHomeroomAssessmentRecapDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.getHomeroomRecaps(
      user.tenantId,
      query,
      user,
    );
    return successResponse(data, "Homeroom recap retrieved", 200);
  }

  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get("homeroom/options")
  async getHomeroomRecapOptions(@UserDecorator() user: JwtUser) {
    const data = await this.service.getHomeroomRecapOptions(
      user.tenantId,
      user,
    );
    return successResponse(data, "Homeroom recap options retrieved", 200);
  }

  @Roles(Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get("homeroom/:submissionId")
  async getHomeroomRecapDetail(
    @Param("submissionId", ParseUUIDPipe) submissionId: string,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.getHomeroomRecapDetail(
      user.tenantId,
      submissionId,
      user,
    );
    return successResponse(data, "Homeroom recap detail retrieved", 200);
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
  @RequirePermissions(Permission.GRADE_UPDATE)
  @Post("change-requests/:id/decision")
  async decideChangeRequest(
    @Param("id") id: string,
    @Body() body: DecideAssessmentRecapChangeDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.decideHomeroomChangeRequest(
      user.tenantId,
      id,
      body,
      user,
    );
    return successResponse(data, "Change request decided", 200);
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
