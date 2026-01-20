import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSubject } from "./api.client";
import { subjectsQueryKeys } from "./subjects.keys";
import type { UpdateSubjectVars } from "./subjects.types";

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSubjectVars) => updateSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.lists() });
    },
  });
}
