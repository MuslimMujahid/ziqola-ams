import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTenantProfileField } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { CreateTenantFieldVars } from "./profile-custom-fields.types";

const PROFILE_CONFIG_BATCH_TYPES_KEY = "PROFILE";

export function useCreateTenantProfileField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: CreateTenantFieldVars) => createTenantProfileField(vars),
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
        queryKey: profileCustomFieldsKeys.tenantFields(
          vars.tenantId,
          vars.role,
        ),
      });
    },
  });
}
