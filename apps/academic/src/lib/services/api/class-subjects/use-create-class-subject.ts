import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClassSubject } from "./api.client";
import { classSubjectsQueryKeys } from "./class-subjects.keys";
import type { CreateClassSubjectVars } from "./class-subjects.types";

export function useCreateClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassSubjectVars) =>
      createClassSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classSubjectsQueryKeys.lists(),
      });
    },
  });
}
