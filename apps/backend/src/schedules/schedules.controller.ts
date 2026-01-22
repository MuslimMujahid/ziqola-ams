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
import { SchedulesService } from "./schedules.service";
import { ScheduleQueryDto } from "./dto/schedule-query.dto";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("schedules")
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER)
  @RequirePermissions(Permission.SCHEDULE_READ)
  @Get()
  async listSchedules(
    @Query() query: ScheduleQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.schedules.getSchedules(user.tenantId, query);
    return paginatedResponse(
      result.data,
      { ...query, total: result.total, sort: "startTime" },
      "Schedules retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SCHEDULE_CREATE)
  @Post()
  async createSchedule(
    @Body() dto: CreateScheduleDto,
    @UserDecorator() user: JwtUser,
  ) {
    const schedule = await this.schedules.createSchedule(user.tenantId, dto);
    return successResponse(schedule, "Schedule created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SCHEDULE_UPDATE)
  @Patch(":id")
  async updateSchedule(
    @Param("id") id: string,
    @Body() dto: UpdateScheduleDto,
    @UserDecorator() user: JwtUser,
  ) {
    const schedule = await this.schedules.updateSchedule(
      user.tenantId,
      id,
      dto,
    );
    return successResponse(schedule, "Schedule updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.SCHEDULE_DELETE)
  @Delete(":id")
  async deleteSchedule(
    @Param("id") id: string,
    @UserDecorator() user: JwtUser,
  ) {
    const schedule = await this.schedules.deleteSchedule(user.tenantId, id);
    return successResponse(schedule, "Schedule deleted", 200);
  }
}
