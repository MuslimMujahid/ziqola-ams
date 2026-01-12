import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import {
  Permission,
  RequirePermissions,
  Roles,
  Role,
  successResponse,
  User as UserDecorator,
  Public,
} from "../common";

interface JwtUser {
  sub: string;
  tenantId: string;
  email: string;
  role: Role;
}

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenants.create(dto);
    return successResponse(tenant, "Tenant created successfully", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.TENANT_READ)
  @Get(":id")
  async findOne(@Param("id") id: string, @UserDecorator() user: JwtUser) {
    const tenant = await this.tenants.findOne(user.tenantId, id);
    return successResponse(tenant, "Tenant retrieved successfully", 200);
  }

  @Roles(Role.PRINCIPAL)
  @RequirePermissions(Permission.TENANT_UPDATE)
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateTenantDto,
    @UserDecorator() user: JwtUser
  ) {
    const tenant = await this.tenants.update(user.tenantId, id, dto);
    return successResponse(tenant, "Tenant updated successfully", 200);
  }
}
