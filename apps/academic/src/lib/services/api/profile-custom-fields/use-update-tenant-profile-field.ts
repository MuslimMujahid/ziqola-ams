import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTenantProfileField } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { UpdateTenantFieldVars } from "./profile-custom-fields.types";

const PROFILE_CONFIG_BATCH_TYPES_KEY = "PROFILE";

export function useUpdateTenantProfileField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: UpdateTenantFieldVars) => updateTenantProfileField(vars),
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
          "student",
        ),
      });
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.tenantFields(
          vars.tenantId,
          "teacher",
        ),
      });
    },
  });
}
