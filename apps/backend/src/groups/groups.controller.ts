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
import { GroupsService } from "./groups.service";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  paginatedResponse,
  successResponse,
} from "../common";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { GroupQueryDto } from "./dto/group-query.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("groups")
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.GROUP_READ)
  @Get()
  async listGroups(
    @Query() query: GroupQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.groups.getGroups(user.tenantId, query);
    return paginatedResponse(
      result.data,
      { ...query, total: result.total, sort: "createdAt" },
      "Groups retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.GROUP_CREATE)
  @Post()
  async createGroup(
    @Body() dto: CreateGroupDto,
    @UserDecorator() user: JwtUser,
  ) {
    const group = await this.groups.createGroup(user.tenantId, dto);
    return successResponse(group, "Group created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.GROUP_UPDATE)
  @Patch(":id")
  async updateGroup(
    @Param("id") id: string,
    @Body() dto: UpdateGroupDto,
    @UserDecorator() user: JwtUser,
  ) {
    const group = await this.groups.updateGroup(user.tenantId, id, dto);
    return successResponse(group, "Group updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.GROUP_DELETE)
  @Delete(":id")
  async deleteGroup(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const group = await this.groups.deleteGroup(user.tenantId, id);
    return successResponse(group, "Group deleted", 200);
  }
}
