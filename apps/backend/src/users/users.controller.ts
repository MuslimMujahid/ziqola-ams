import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { ListUsersDto } from "./dto/list-users.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import {
  Permission,
  RequirePermissions,
  Roles,
  Role,
  successResponse,
  paginatedResponse,
  User as UserDecorator,
} from "../common";

interface JwtUser {
  sub: string;
  tenantId: string;
  email: string;
  role: Role;
}

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.USER_READ)
  @Get()
  async findAll(@Query() query: ListUsersDto, @UserDecorator() user: JwtUser) {
    const users = await this.users.findAll(user.tenantId, query);
    return paginatedResponse(users, query, "Users retrieved successfully", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER, Role.STUDENT)
  @Get(":id")
  async findOne(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const isSelf = user.sub === id;
    const isAdmin = [Role.PRINCIPAL, Role.ADMIN_STAFF].includes(user.role);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException("Insufficient permissions");
    }

    const result = await this.users.findOne(user.tenantId, id);
    return successResponse(result, "User retrieved successfully", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER, Role.STUDENT)
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @UserDecorator() user: JwtUser
  ) {
    const isSelf = user.sub === id;
    const isAdmin = [Role.PRINCIPAL, Role.ADMIN_STAFF].includes(user.role);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException("Insufficient permissions");
    }

    if (!isAdmin) {
      if (dto.email || dto.role) {
        throw new ForbiddenException("Insufficient permissions");
      }
    }

    if (dto.role && isSelf) {
      throw new BadRequestException("Cannot change own role");
    }

    const result = await this.users.update(user.tenantId, id, dto, {
      allowRoleChange: isAdmin && !isSelf,
    });
    return successResponse(result, "User updated successfully", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.USER_DELETE)
  @Delete(":id")
  async remove(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    if (user.sub === id) {
      throw new BadRequestException("Cannot delete own account");
    }

    await this.users.delete(user.tenantId, id);
    return successResponse(null, "User deleted successfully", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.USER_UPDATE)
  @Post(":id/reset-password")
  async resetPassword(
    @Param("id") id: string,
    @Body() dto: ResetPasswordDto,
    @UserDecorator() user: JwtUser
  ) {
    if (user.sub === id) {
      throw new BadRequestException("Cannot reset own password");
    }

    await this.users.resetPassword(user.tenantId, id, dto.newPassword);
    return successResponse(null, "Password reset successfully", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER, Role.STUDENT)
  @Patch(":id/change-password")
  async changePassword(
    @Param("id") id: string,
    @Body() dto: ChangePasswordDto,
    @UserDecorator() user: JwtUser
  ) {
    if (user.sub !== id) {
      throw new ForbiddenException("Insufficient permissions");
    }

    await this.users.changePassword(
      user.tenantId,
      id,
      dto.currentPassword,
      dto.newPassword
    );
    return successResponse(null, "Password changed successfully", 200);
  }
}
