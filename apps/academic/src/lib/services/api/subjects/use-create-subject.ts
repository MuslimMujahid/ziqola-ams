import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSubject } from "./api.client";
import { subjectsQueryKeys } from "./subjects.keys";
import type { CreateSubjectVars } from "./subjects.types";

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubjectVars) => createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.lists() });
    },
  });
}
