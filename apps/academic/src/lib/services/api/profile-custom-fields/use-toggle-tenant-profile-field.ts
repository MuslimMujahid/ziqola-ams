import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  enableTenantProfileField,
  disableTenantProfileField,
} from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type {
  EnableTenantFieldVars,
  ProfileRole,
} from "./profile-custom-fields.types";

const PROFILE_CONFIG_BATCH_TYPES_KEY = "PROFILE";

export function useEnableTenantProfileField(role: ProfileRole) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: EnableTenantFieldVars) => enableTenantProfileField(vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantConfiguration(vars.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantConfigurationsBatch(
          vars.tenantId,
          PROFILE_CONFIG_BATCH_TYPES_KEY,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantFields(vars.tenantId, role),
      });
    },
  });
}

export function useDisableTenantProfileField(role: ProfileRole) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: EnableTenantFieldVars) =>
      disableTenantProfileField(vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantConfiguration(vars.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantConfigurationsBatch(
          vars.tenantId,
          PROFILE_CONFIG_BATCH_TYPES_KEY,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantFields(vars.tenantId, role),
      });
    },
  });
}
