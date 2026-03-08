import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { RegisterTenantDto } from "./dto/register-tenant.dto";
import { CheckSchoolCodeQueryDto } from "./dto/check-school-code.dto";
import { CheckEmailQueryDto } from "./dto/check-email.dto";
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

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Get("check-school-code")
  async checkSchoolCodeAvailability(@Query() query: CheckSchoolCodeQueryDto) {
    const result = await this.tenants.checkSchoolCodeAvailability(
      query.schoolCode,
    );
    return successResponse(
      result,
      "School code availability retrieved successfully",
      200,
    );
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Get("check-email")
  async checkEmailAvailability(@Query() query: CheckEmailQueryDto) {
    const result = await this.tenants.checkEmailAvailability(query.email);
    return successResponse(
      result,
      "Email availability retrieved successfully",
      200,
    );
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post("register")
  async register(@Body() dto: RegisterTenantDto) {
    const result = await this.tenants.registerTenant(dto);
    return successResponse(result, "Tenant registered successfully", 201);
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
    @UserDecorator() user: JwtUser,
  ) {
    const tenant = await this.tenants.update(user.tenantId, id, dto);
    return successResponse(tenant, "Tenant updated successfully", 200);
  }
}
