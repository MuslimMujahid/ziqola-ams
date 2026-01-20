import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  Permission,
  Public,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  paginatedResponse,
  successResponse,
} from "../common";
import { SessionsService } from "./sessions.service";
import { SessionQueryDto } from "./dto/session-query.dto";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { GenerateSessionsDto } from "./dto/generate-sessions.dto";

type JwtUser = {
  sub: string;
  tenantId: string;
  role: Role;
};

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.SESSION_READ)
  @Get()
  async listSessions(
    @Query() query: SessionQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.sessions.getSessions(user.tenantId, query, user);
    return paginatedResponse(
      result.data,
      { ...query, total: result.total, sort: "date" },
      "Sessions retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.SESSION_CREATE)
  @Post()
  async createSession(
    @Body() dto: CreateSessionDto,
    @UserDecorator() user: JwtUser,
  ) {
    const session = await this.sessions.createSession(user.tenantId, dto, user);
    return successResponse(session, "Session created", 201);
  }

  @Public()
  @Post("generate")
  async generateSessions(
    @Body() dto: GenerateSessionsDto,
    @Headers("x-cron-secret") cronSecret?: string,
  ) {
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || !cronSecret || cronSecret !== expectedSecret) {
      throw new ForbiddenException("Invalid cron secret");
    }

    const result = await this.sessions.generateScheduledSessions(dto);
    return successResponse(result, "Sessions generated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SESSION_UPDATE)
  @Patch(":id")
  async updateSession(
    @Param("id") id: string,
    @Body() dto: UpdateSessionDto,
    @UserDecorator() user: JwtUser,
  ) {
    const session = await this.sessions.updateSession(
      user.tenantId,
      id,
      dto,
      user,
    );
    return successResponse(session, "Session updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SESSION_DELETE)
  @Delete(":id")
  async deleteSession(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const session = await this.sessions.deleteSession(user.tenantId, id, user);
    return successResponse(session, "Session deleted", 200);
  }
}
