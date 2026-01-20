import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSession } from "./api.client";
import { sessionsQueryKeys } from "./sessions.keys";
import type { UpdateSessionVars } from "./sessions.types";

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSessionVars) => updateSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsQueryKeys.lists(),
      });
    },
  });
}
