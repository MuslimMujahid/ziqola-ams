import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
import { AssessmentComponentsService } from "./assessment-components.service";
import {
  CreateAssessmentComponentDto,
  ListAssessmentComponentsDto,
  ListAssessmentTypeWeightsDto,
  UpdateAssessmentComponentDto,
  UpsertAssessmentTypeWeightDto,
} from "./dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("assessment-components")
export class AssessmentComponentsController {
  constructor(private readonly service: AssessmentComponentsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get()
  async listComponents(
    @Query() query: ListAssessmentComponentsDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.listComponents(user.tenantId, query, user);
    return successResponse(data, "Assessment components retrieved", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_CONFIGURE)
  @Post()
  async createComponent(
    @Body() dto: CreateAssessmentComponentDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.createComponent(user.tenantId, dto, user);
    return successResponse(data, "Assessment component created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_CONFIGURE)
  @Patch(":id")
  async updateComponent(
    @Param("id") id: string,
    @Body() dto: UpdateAssessmentComponentDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.updateComponent(
      user.tenantId,
      id,
      dto,
      user,
    );
    return successResponse(data, "Assessment component updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_CONFIGURE)
  @Delete(":id")
  async deleteComponent(
    @Param("id") id: string,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.deleteComponent(user.tenantId, id, user);
    return successResponse(data, "Assessment component deleted", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_READ)
  @Get("type-weights")
  async listTypeWeights(
    @Query() query: ListAssessmentTypeWeightsDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.listTypeWeights(user.tenantId, query, user);
    return successResponse(data, "Assessment type weights retrieved", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.ASSESSMENT_CONFIGURE)
  @Put("type-weights")
  async upsertTypeWeight(
    @Body() dto: UpsertAssessmentTypeWeightDto,
    @UserDecorator() user: JwtUser,
  ) {
    const data = await this.service.upsertTypeWeight(user.tenantId, dto, user);
    return successResponse(data, "Assessment type weight saved", 200);
  }
}
