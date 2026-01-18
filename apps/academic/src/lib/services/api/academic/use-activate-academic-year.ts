import { useMutation, useQueryClient } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { activateAcademicYear } from "./api.client";
import type { ActivateAcademicYearVars } from "./academic.types";

export function useActivateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ActivateAcademicYearVars) =>
      activateAcademicYear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.context() });
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          Array.isArray(queryKey) &&
          queryKey[0] === "academic" &&
          queryKey[1] === "years",
      });
    },
  });
}
