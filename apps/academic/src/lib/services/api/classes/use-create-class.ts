import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClass } from "./api.client";
import { classesQueryKeys } from "./classes.keys";
import type { CreateClassVars } from "./classes.types";

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClassVars) => createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
    },
  });
}
