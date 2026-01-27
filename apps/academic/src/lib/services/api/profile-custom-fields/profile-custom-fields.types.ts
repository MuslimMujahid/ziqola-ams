import type { ApiResponse } from "@/lib/services/api/api.types";

export type ProfileRole = "student" | "teacher";

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiSelect"
  | "file";

export type FieldValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
  dateRange?: { min?: string; max?: string };
  fileConstraints?: {
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
  };
};

export type FieldOption = {
  label: string;
  value: string;
  order?: number;
};

export type ConfigurationField = {
  key: string;
  label: string;
  type: FieldType;
  helpText?: string | null;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
  order?: number | null;
  isEnabled?: boolean | null;
};

export type AssessmentTypeConfiguration = {
  key: string;
  label: string;
  description?: string | null;
  order?: number | null;
  isEnabled?: boolean | null;
};

export type ProfileConfiguration = {
  profile: {
    customFields: {
      student: ConfigurationField[];
      teacher: ConfigurationField[];
    };
  };
  assessmentTypes?: AssessmentTypeConfiguration[];
};

export type ProfileTemplateSummary = {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type ProfileTemplateDetail = ProfileTemplateSummary &
  ProfileConfiguration;

export type TenantProfileConfiguration = {
  id: string;
  tenantId: string;
  configType: "PROFILE";
  templateId?: string | null;
  isCustomized: boolean;
  appliedAt?: string | null;
  templateHash?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantProfileField = {
  id: string;
  tenantId: string;
  role: ProfileRole;
  key: string;
  label: string;
  type: FieldType;
  helpText?: string | null;
  options?: FieldOption[] | null;
  validation?: FieldValidation | null;
  order?: number | null;
  isEnabled: boolean;
  sourceTemplateId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TenantAssessmentType = {
  id: string;
  tenantId: string;
  key: string;
  label: string;
  description?: string | null;
  order?: number | null;
  isEnabled: boolean;
  sourceTemplateId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileFieldValue = {
  id: string;
  tenantId: string;
  role: ProfileRole;
  profileId: string;
  fieldId: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueDate?: string | null;
  valueBoolean?: boolean | null;
  valueSelect?: string | null;
  valueMultiSelect?: string[] | null;
  valueFile?: {
    fileKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url?: string;
  } | null;
  updatedAt: string;
};

export type ApplyTemplateVars = {
  tenantId: string;
  templateId?: string;
  config?: ProfileConfiguration;
};

export type ConfigurationBatchType = "PROFILE";

export type BatchConfigurationsVars = {
  tenantId: string;
  types: ConfigurationBatchType[];
};

export type CreateTenantFieldVars = {
  tenantId: string;
  role: ProfileRole;
  key: string;
  label: string;
  type: FieldType;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  order?: number;
};

export type UpdateTenantFieldVars = {
  tenantId: string;
  fieldId: string;
  label?: string;
  type?: FieldType;
  helpText?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  order?: number;
  isEnabled?: boolean;
};

export type EnableTenantFieldVars = {
  tenantId: string;
  fieldId: string;
};

export type ProfileFieldValueInput = {
  fieldId: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  valueBoolean?: boolean;
  valueSelect?: string;
  valueMultiSelect?: string[];
  valueFile?: {
    fileKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  };
};

export type UpsertProfileValuesVars = {
  tenantId: string;
  role: ProfileRole;
  profileId: string;
  values: ProfileFieldValueInput[];
};

export type FilterCondition = {
  fieldKey: string;
  op: string;
  value: unknown;
};

export type FilterProfilesVars = {
  tenantId: string;
  role: ProfileRole;
  filters: FilterCondition[];
  search?: string;
  academicYearId?: string;
  classId?: string;
  withoutClass?: boolean;
  includeCustomFields?: boolean;
  pagination?: {
    page?: number;
    pageSize?: number;
  };
};

export type ExportProfilesVars = FilterProfilesVars & {
  format: "csv" | "xlsx";
};

export type ListTenantAssessmentTypesVars = {
  tenantId: string;
  includeDisabled?: boolean;
};

export type ProfileFieldsResponse = ApiResponse<TenantProfileField[]>;
export type ProfileTemplatesResponse = ApiResponse<ProfileTemplateSummary[]>;
export type ProfileTemplateResponse = ApiResponse<ProfileTemplateDetail>;
export type TenantProfileConfigurationResponse =
  ApiResponse<TenantProfileConfiguration | null>;
export type TenantProfileConfigurationBatchPayload = {
  configuration: TenantProfileConfiguration | null;
  studentFields: TenantProfileField[];
  teacherFields: TenantProfileField[];
  assessmentTypes: TenantAssessmentType[];
};
export type TenantConfigurationsBatchResponse = ApiResponse<{
  PROFILE?: TenantProfileConfigurationBatchPayload;
}>;
export type ApplyTemplateResponse = ApiResponse<{
  applied: boolean;
  created: number;
}>;
export type CreateTenantFieldResponse = ApiResponse<TenantProfileField>;
export type UpdateTenantFieldResponse = ApiResponse<TenantProfileField>;
export type ProfileFieldsValuesResponse = ApiResponse<{
  fields: TenantProfileField[];
  values: ProfileFieldValue[];
}>;
export type UpsertProfileValuesResponse = ApiResponse<{ updated: boolean }>;
export type FilterProfilesResponse<TProfile> = ApiResponse<{
  data: TProfile[];
  total: number;
}>;
export type ExportProfilesResponse = ApiResponse<{ downloadUrl: string }>;
export type ListTenantAssessmentTypesResponse = ApiResponse<
  TenantAssessmentType[]
>;
