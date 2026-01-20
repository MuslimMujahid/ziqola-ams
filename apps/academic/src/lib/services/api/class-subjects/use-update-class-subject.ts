import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateClassSubject } from "./api.client";
import { classSubjectsQueryKeys } from "./class-subjects.keys";
import type { UpdateClassSubjectVars } from "./class-subjects.types";

export function useUpdateClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClassSubjectVars) =>
      updateClassSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classSubjectsQueryKeys.lists(),
      });
    },
  });
}
