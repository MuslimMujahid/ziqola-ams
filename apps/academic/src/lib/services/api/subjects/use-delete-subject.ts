import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSubject } from "./api.client";
import { subjectsQueryKeys } from "./subjects.keys";
import type { DeleteSubjectVars } from "./subjects.types";

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteSubjectVars) => deleteSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsQueryKeys.lists() });
    },
  });
}
