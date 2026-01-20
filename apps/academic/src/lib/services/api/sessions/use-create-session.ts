import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSession } from "./api.client";
import { sessionsQueryKeys } from "./sessions.keys";
import type { CreateSessionVars } from "./sessions.types";

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSessionVars) => createSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sessionsQueryKeys.lists(),
      });
    },
  });
}
