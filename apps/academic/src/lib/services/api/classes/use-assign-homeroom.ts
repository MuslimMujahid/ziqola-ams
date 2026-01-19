import { useMutation, useQueryClient } from "@tanstack/react-query";

import { assignHomeroom } from "./api.client";
import { classesQueryKeys } from "./classes.keys";
import type { AssignHomeroomVars } from "./classes.types";

export function useAssignHomeroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignHomeroomVars) => assignHomeroom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
    },
  });
}
