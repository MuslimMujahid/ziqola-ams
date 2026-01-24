import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyProfileTemplate } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { ApplyTemplateVars } from "./profile-custom-fields.types";

const PROFILE_CONFIG_BATCH_TYPES_KEY = "PROFILE";

export function useApplyProfileTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: ApplyTemplateVars) => applyProfileTemplate(vars),
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
      ["student", "teacher"].forEach((role) => {
        queryClient.invalidateQueries({
          queryKey: profileCustomFieldsKeys.tenantFields(vars.tenantId, role),
        });
      });
    },
  });
}
