import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteClassSubject } from "./api.client";
import { classSubjectsQueryKeys } from "./class-subjects.keys";
import type { DeleteClassSubjectVars } from "./class-subjects.types";

export function useDeleteClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteClassSubjectVars) =>
      deleteClassSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classSubjectsQueryKeys.lists(),
      });
    },
  });
}
