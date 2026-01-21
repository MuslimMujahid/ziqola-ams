import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSessionMaterialAttachment } from "./api.client";
import { sessionMaterialsQueryKeys } from "./session-materials.keys";
import type { DeleteSessionMaterialAttachmentVars } from "./session-materials.types";

export function useDeleteSessionMaterialAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteSessionMaterialAttachmentVars) =>
      deleteSessionMaterialAttachment(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionMaterialsQueryKeys.session(variables.sessionId),
      });
    },
  });
}
