import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { listTenantAssessmentTypes } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type {
  ListTenantAssessmentTypesResponse,
  ListTenantAssessmentTypesVars,
} from "./profile-custom-fields.types";

export function useTenantAssessmentTypes(
  vars: ListTenantAssessmentTypesVars,
  options?: { enabled?: boolean },
) {
  return useQuery<ListTenantAssessmentTypesResponse>({
    queryKey: profileCustomFieldsKeys.tenantAssessmentTypes(
      vars.tenantId,
      vars.includeDisabled,
    ),
    queryFn: () => listTenantAssessmentTypes(vars),
    enabled: options?.enabled ?? true,
  });
}

export function useSuspenseTenantAssessmentTypes(
  vars: ListTenantAssessmentTypesVars,
) {
  return useSuspenseQuery<ListTenantAssessmentTypesResponse>({
    queryKey: profileCustomFieldsKeys.tenantAssessmentTypes(
      vars.tenantId,
      vars.includeDisabled,
    ),
    queryFn: () => listTenantAssessmentTypes(vars),
  });
}
