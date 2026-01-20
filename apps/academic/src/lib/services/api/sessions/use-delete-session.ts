import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSession } from "./api.client";
import { sessionsQueryKeys } from "./sessions.keys";
import type { DeleteSessionVars } from "./sessions.types";

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteSessionVars) => deleteSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsQueryKeys.lists(),
      });
    },
  });
}
