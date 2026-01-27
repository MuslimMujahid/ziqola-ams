import type { ProfileRole } from "./profile-custom-fields.types";

const profileCustomFieldsKeys = {
  all: ["profile-custom-fields"] as const,
  templates: () => [...profileCustomFieldsKeys.all, "templates"] as const,
  templateDetail: (templateId: string) =>
    [...profileCustomFieldsKeys.templates(), "detail", templateId] as const,
  tenantConfiguration: (tenantId: string) =>
    [...profileCustomFieldsKeys.all, "tenant-configuration", tenantId] as const,
  tenantConfigurationsBatch: (tenantId: string, typesKey: string) =>
    [
      ...profileCustomFieldsKeys.all,
      "tenant-configurations-batch",
      tenantId,
      typesKey,
    ] as const,
  tenantFields: (tenantId: string, role: ProfileRole) =>
    [...profileCustomFieldsKeys.all, "tenant-fields", tenantId, role] as const,
  profileValues: (tenantId: string, role: ProfileRole, profileId: string) =>
    [
      ...profileCustomFieldsKeys.all,
      "profile-values",
      tenantId,
      role,
      profileId,
    ] as const,
  filteredProfiles: (tenantId: string, role: ProfileRole, filtersKey: string) =>
    [
      ...profileCustomFieldsKeys.all,
      "filtered-profiles",
      tenantId,
      role,
      filtersKey,
    ] as const,
  tenantAssessmentTypes: (tenantId: string, includeDisabled?: boolean) =>
    [
      ...profileCustomFieldsKeys.all,
      "tenant-assessment-types",
      tenantId,
      includeDisabled ?? false,
    ] as const,
};

export { profileCustomFieldsKeys };
