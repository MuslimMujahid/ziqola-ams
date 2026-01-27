import { clientApi } from "@/lib/services/api/api";
import type {
  ApplyTemplateResponse,
  ApplyTemplateVars,
  BatchConfigurationsVars,
  CreateTenantFieldResponse,
  CreateTenantFieldVars,
  EnableTenantFieldVars,
  ExportProfilesResponse,
  ExportProfilesVars,
  FilterProfilesResponse,
  FilterProfilesVars,
  ListTenantAssessmentTypesResponse,
  ListTenantAssessmentTypesVars,
  ProfileFieldsResponse,
  ProfileFieldsValuesResponse,
  TenantProfileConfigurationResponse,
  TenantConfigurationsBatchResponse,
  ProfileTemplatesResponse,
  ProfileTemplateResponse,
  UpdateTenantFieldResponse,
  UpdateTenantFieldVars,
  UpsertProfileValuesResponse,
  UpsertProfileValuesVars,
} from "./profile-custom-fields.types";

async function listProfileTemplates() {
  const response = await clientApi.get<ProfileTemplatesResponse>(
    "/configurations/templates",
  );
  return response.data;
}

async function getProfileTemplate(templateId: string) {
  const response = await clientApi.get<ProfileTemplateResponse>(
    `/configurations/templates/${templateId}`,
  );
  return response.data;
}

async function getTenantProfileConfiguration(tenantId: string) {
  const response = await clientApi.get<TenantProfileConfigurationResponse>(
    `/configurations/tenants/${tenantId}/profile-configuration`,
  );
  return response.data;
}

async function getTenantConfigurationsBatch(vars: BatchConfigurationsVars) {
  const response = await clientApi.post<TenantConfigurationsBatchResponse>(
    `/configurations/tenants/${vars.tenantId}/configurations/batch`,
    { types: vars.types },
  );
  return response.data;
}

async function applyProfileTemplate(vars: ApplyTemplateVars) {
  const response = await clientApi.post<ApplyTemplateResponse>(
    `/configurations/tenants/${vars.tenantId}/apply`,
    {
      templateId: vars.templateId,
      config: vars.config,
    },
  );
  return response.data;
}

async function listTenantProfileFields(tenantId: string, role: string) {
  const response = await clientApi.get<ProfileFieldsResponse>(
    `/configurations/tenants/${tenantId}/profile-fields`,
    { params: { role } },
  );
  return response.data;
}

async function createTenantProfileField(vars: CreateTenantFieldVars) {
  const response = await clientApi.post<CreateTenantFieldResponse>(
    `/configurations/tenants/${vars.tenantId}/profile-fields`,
    vars,
  );
  return response.data;
}

async function updateTenantProfileField(vars: UpdateTenantFieldVars) {
  const response = await clientApi.patch<UpdateTenantFieldResponse>(
    `/configurations/tenants/${vars.tenantId}/profile-fields/${vars.fieldId}`,
    vars,
  );
  return response.data;
}

async function enableTenantProfileField(vars: EnableTenantFieldVars) {
  const response = await clientApi.post<UpdateTenantFieldResponse>(
    `/configurations/tenants/${vars.tenantId}/profile-fields/${vars.fieldId}/enable`,
  );
  return response.data;
}

async function disableTenantProfileField(vars: EnableTenantFieldVars) {
  const response = await clientApi.post<UpdateTenantFieldResponse>(
    `/configurations/tenants/${vars.tenantId}/profile-fields/${vars.fieldId}/disable`,
  );
  return response.data;
}

async function getProfileFieldsAndValues(
  tenantId: string,
  role: string,
  profileId: string,
) {
  const response = await clientApi.get<ProfileFieldsValuesResponse>(
    `/configurations/tenants/${tenantId}/profiles/${profileId}/custom-fields`,
    { params: { role } },
  );
  return response.data;
}

async function upsertProfileValues(vars: UpsertProfileValuesVars) {
  const response = await clientApi.put<UpsertProfileValuesResponse>(
    `/configurations/tenants/${vars.tenantId}/profiles/${vars.profileId}/custom-fields`,
    { values: vars.values },
    { params: { role: vars.role } },
  );
  return response.data;
}

async function filterProfiles<TProfile>(vars: FilterProfilesVars) {
  const response = await clientApi.post<FilterProfilesResponse<TProfile>>(
    `/configurations/tenants/${vars.tenantId}/profiles/filter`,
    {
      filters: vars.filters,
      pagination: vars.pagination,
      search: vars.search,
      academicYearId: vars.academicYearId,
      classId: vars.classId,
      withoutClass: vars.withoutClass,
      includeCustomFields: vars.includeCustomFields,
    },
    { params: { role: vars.role } },
  );
  return response.data;
}

async function exportProfiles(vars: ExportProfilesVars) {
  const response = await clientApi.post<ExportProfilesResponse>(
    `/configurations/tenants/${vars.tenantId}/profiles/export`,
    {
      filters: vars.filters,
      pagination: vars.pagination,
      search: vars.search,
      academicYearId: vars.academicYearId,
      classId: vars.classId,
      withoutClass: vars.withoutClass,
      format: vars.format,
    },
    { params: { role: vars.role } },
  );
  return response.data;
}

async function listTenantAssessmentTypes(vars: ListTenantAssessmentTypesVars) {
  const response = await clientApi.get<ListTenantAssessmentTypesResponse>(
    `/configurations/tenants/${vars.tenantId}/assessment-types`,
    { params: { includeDisabled: vars.includeDisabled } },
  );
  return response.data;
}

export {
  listProfileTemplates,
  getProfileTemplate,
  getTenantProfileConfiguration,
  getTenantConfigurationsBatch,
  applyProfileTemplate,
  listTenantProfileFields,
  createTenantProfileField,
  updateTenantProfileField,
  enableTenantProfileField,
  disableTenantProfileField,
  getProfileFieldsAndValues,
  upsertProfileValues,
  filterProfiles,
  exportProfiles,
  listTenantAssessmentTypes,
};
