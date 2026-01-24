import {
  Body,
  Controller,
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
import { ConfigurationsService } from "./configurations.service";
import { ApplyConfigurationDto } from "./dto/apply-configuration.dto";
import { BatchConfigurationsDto } from "./dto/batch-configurations.dto";
import { CreateTenantProfileFieldDto } from "./dto/create-tenant-profile-field.dto";
import { ListTenantProfileFieldsDto } from "./dto/list-tenant-profile-fields.dto";
import { UpdateTenantProfileFieldDto } from "./dto/update-tenant-profile-field.dto";
import { UpsertProfileFieldValuesDto } from "./dto/upsert-profile-field-values.dto";
import { FilterProfilesDto } from "./dto/filter-profiles.dto";
import { ExportProfilesDto } from "./dto/export-profiles.dto";

interface JwtUser {
  sub: string;
  tenantId: string;
  role: Role;
}

@Controller("configurations")
export class ConfigurationsController {
  constructor(private readonly service: ConfigurationsService) {}

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_TEMPLATE_READ)
  @Get("templates")
  async listTemplates() {
    const templates = await this.service.listTemplates();
    return successResponse(
      templates,
      "Profile templates retrieved successfully",
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_TEMPLATE_READ)
  @Get("templates/:templateId")
  async getTemplate(@Param("templateId") templateId: string) {
    const template = await this.service.getTemplate(templateId);
    return successResponse(template, "Profile template retrieved successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_TEMPLATE_READ)
  @Get("tenants/:tenantId/profile-configuration")
  async getTenantProfileConfiguration(
    @Param("tenantId") tenantId: string,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const configuration =
      await this.service.getTenantProfileConfiguration(tenantId);
    return successResponse(
      configuration,
      "Tenant profile configuration retrieved successfully",
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_TEMPLATE_READ)
  @RequirePermissions(Permission.PROFILE_FIELD_READ)
  @Post("tenants/:tenantId/configurations/batch")
  async getTenantConfigurationsBatch(
    @Param("tenantId") tenantId: string,
    @Body() dto: BatchConfigurationsDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const payload = await this.service.getTenantConfigurationsBatch(
      tenantId,
      dto.types,
    );
    return successResponse(
      payload,
      "Tenant configurations retrieved successfully",
    );
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_TEMPLATE_APPLY)
  @Post("tenants/:tenantId/apply")
  async applyTemplate(
    @Param("tenantId") tenantId: string,
    @Body() dto: ApplyConfigurationDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const result = await this.service.applyTemplate(tenantId, dto);
    return successResponse(result, "Template applied successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_TEMPLATE_APPLY)
  @RequirePermissions(Permission.PROFILE_FIELD_READ)
  @Get("tenants/:tenantId/profile-fields")
  async listTenantFields(
    @Param("tenantId") tenantId: string,
    @Query() query: ListTenantProfileFieldsDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const fields = await this.service.listTenantFields(
      tenantId,
      query.role ?? "",
    );
    return successResponse(fields, "Profile fields retrieved successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_FIELD_MANAGE)
  @Post("tenants/:tenantId/profile-fields")
  async createTenantField(
    @Param("tenantId") tenantId: string,
    @Body() dto: CreateTenantProfileFieldDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const field = await this.service.createTenantField(tenantId, dto);
    return successResponse(field, "Profile field created successfully", 201);
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_FIELD_MANAGE)
  @Patch("tenants/:tenantId/profile-fields/:fieldId")
  async updateTenantField(
    @Param("tenantId") tenantId: string,
    @Param("fieldId") fieldId: string,
    @Body() dto: UpdateTenantProfileFieldDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const field = await this.service.updateTenantField(tenantId, fieldId, dto);
    return successResponse(field, "Profile field updated successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_FIELD_MANAGE)
  @Post("tenants/:tenantId/profile-fields/:fieldId/enable")
  async enableTenantField(
    @Param("tenantId") tenantId: string,
    @Param("fieldId") fieldId: string,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const field = await this.service.setFieldEnabled(tenantId, fieldId, true);
    return successResponse(field, "Profile field enabled successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_FIELD_MANAGE)
  @Post("tenants/:tenantId/profile-fields/:fieldId/disable")
  async disableTenantField(
    @Param("tenantId") tenantId: string,
    @Param("fieldId") fieldId: string,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const field = await this.service.setFieldEnabled(tenantId, fieldId, false);
    return successResponse(field, "Profile field disabled successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER, Role.STUDENT)
  @RequirePermissions(Permission.PROFILE_CUSTOM_FIELD_READ)
  @Get("tenants/:tenantId/profiles/:profileId/custom-fields")
  async getProfileFieldsAndValues(
    @Param("tenantId") tenantId: string,
    @Param("profileId") profileId: string,
    @Query("role") role: string,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    await this.service.assertProfileAccess(tenantId, role, profileId, {
      id: user.sub,
      role: user.role,
    });
    const result = await this.service.getProfileFieldsAndValues(
      tenantId,
      role,
      profileId,
    );
    return successResponse(result, "Profile fields retrieved successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER, Role.STUDENT)
  @RequirePermissions(Permission.PROFILE_CUSTOM_FIELD_UPDATE)
  @Put("tenants/:tenantId/profiles/:profileId/custom-fields")
  async upsertProfileValues(
    @Param("tenantId") tenantId: string,
    @Param("profileId") profileId: string,
    @Query("role") role: string,
    @Body() dto: UpsertProfileFieldValuesDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    await this.service.assertProfileAccess(tenantId, role, profileId, {
      id: user.sub,
      role: user.role,
    });
    const result = await this.service.upsertProfileValues(
      tenantId,
      role,
      profileId,
      dto.values,
    );
    return successResponse(result, "Profile fields updated successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_CUSTOM_FIELD_READ)
  @Post("tenants/:tenantId/profiles/filter")
  async filterProfiles(
    @Param("tenantId") tenantId: string,
    @Query("role") role: string,
    @Body() dto: FilterProfilesDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const result = await this.service.filterProfiles(tenantId, role, dto);
    return successResponse(result, "Profiles filtered successfully");
  }

  @Roles(Role.PRINCIPAL, Role.ADMIN_STAFF)
  @RequirePermissions(Permission.PROFILE_CUSTOM_FIELD_READ)
  @Post("tenants/:tenantId/profiles/export")
  async exportProfiles(
    @Param("tenantId") tenantId: string,
    @Query("role") role: string,
    @Body() dto: ExportProfilesDto,
    @UserDecorator() user: JwtUser,
  ) {
    await this.service.assertTenantAccess(tenantId, user.tenantId);
    const result = await this.service.exportProfiles(tenantId, role, dto);
    return successResponse(result, "Export generated successfully");
  }
}
