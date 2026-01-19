import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteClass } from "./api.client";
import { classesQueryKeys } from "./classes.keys";
import type { DeleteClassVars } from "./classes.types";

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteClassVars) => deleteClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
    },
  });
}
