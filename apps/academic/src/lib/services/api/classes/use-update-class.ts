import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateClass } from "./api.client";
import { classesQueryKeys } from "./classes.keys";
import type { UpdateClassVars } from "./classes.types";

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClassVars) => updateClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
    },
  });
}
