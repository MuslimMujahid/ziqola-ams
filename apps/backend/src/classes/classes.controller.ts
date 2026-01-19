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
import { ClassesService } from "./classes.service";
import {
  Permission,
  RequirePermissions,
  Role,
  Roles,
  User as UserDecorator,
  paginatedResponse,
  successResponse,
} from "../common";
import { ClassQueryDto } from "./dto/class-query.dto";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { AssignHomeroomDto } from "./dto/assign-homeroom.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("classes")
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.CLASS_READ)
  @Get()
  async listClasses(
    @Query() query: ClassQueryDto,
    @UserDecorator() user: JwtUser,
  ) {
    const result = await this.classes.getClasses(user.tenantId, query);
    return paginatedResponse(
      result.data,
      { ...query, total: result.total, sort: "createdAt" },
      "Classes retrieved",
      200,
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.CLASS_CREATE)
  @Post()
  async createClass(
    @Body() dto: CreateClassDto,
    @UserDecorator() user: JwtUser,
  ) {
    const classItem = await this.classes.createClass(user.tenantId, dto);
    return successResponse(classItem, "Class created", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.CLASS_UPDATE)
  @Patch(":id")
  async updateClass(
    @Param("id") id: string,
    @Body() dto: UpdateClassDto,
    @UserDecorator() user: JwtUser,
  ) {
    const classItem = await this.classes.updateClass(user.tenantId, id, dto);
    return successResponse(classItem, "Class updated", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.CLASS_ASSIGN_HOMEROOM)
  @Post(":id/homeroom")
  async assignHomeroom(
    @Param("id") id: string,
    @Body() dto: AssignHomeroomDto,
    @UserDecorator() user: JwtUser,
  ) {
    const assignment = await this.classes.assignHomeroom(
      user.tenantId,
      id,
      dto,
    );
    return successResponse(assignment, "Homeroom assigned", 200);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.CLASS_DELETE)
  @Delete(":id")
  async deleteClass(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const result = await this.classes.deleteClass(user.tenantId, id);
    return successResponse(result, "Class deleted", 200);
  }
}
