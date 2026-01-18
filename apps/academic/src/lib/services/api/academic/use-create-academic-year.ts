import { useMutation, useQueryClient } from "@tanstack/react-query";
import { academicQueryKeys } from "./academic.keys";
import { createAcademicYear } from "./api.client";
import type { CreateAcademicYearVars } from "./academic.types";

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicYearVars) =>
      createAcademicYear(payload),
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
