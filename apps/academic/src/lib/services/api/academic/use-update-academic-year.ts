import { useMutation, useQueryClient } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { updateAcademicYear } from "./api.client";
import type { UpdateAcademicYearVars } from "./academic.types";

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAcademicYearVars) =>
      updateAcademicYear(payload),
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
