import { useMutation, useQueryClient } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { deleteAcademicYear } from "./api.client";
import type { DeleteAcademicYearVars } from "./academic.types";

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteAcademicYearVars) =>
      deleteAcademicYear(payload),
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
