import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertProfileValues } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { UpsertProfileValuesVars } from "./profile-custom-fields.types";

export function useUpsertProfileValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: UpsertProfileValuesVars) => upsertProfileValues(vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: profileCustomFieldsKeys.profileValues(
          vars.tenantId,
          vars.role,
          vars.profileId,
        ),
      });
    },
  });
}
