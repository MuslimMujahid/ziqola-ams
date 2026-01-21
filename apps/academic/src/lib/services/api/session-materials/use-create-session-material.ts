import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertSessionMaterial } from "./api.client";
import { sessionMaterialsQueryKeys } from "./session-materials.keys";
import type { UpsertSessionMaterialVars } from "./session-materials.types";

export function useUpsertSessionMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertSessionMaterialVars) =>
      upsertSessionMaterial(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: sessionMaterialsQueryKeys.session(data.sessionId),
      });
    },
  });
}
