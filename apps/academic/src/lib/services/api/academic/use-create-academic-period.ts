import { useMutation, useQueryClient } from "@tanstack/react-query";
import { academicQueryKeys } from "./academic.keys";
import { createAcademicPeriod } from "./api.client";
import type { CreateAcademicPeriodVars } from "./academic.types";

export function useCreateAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicPeriodVars) =>
      createAcademicPeriod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.context() });
      queryClient.invalidateQueries({
        queryKey: academicQueryKeys.periods(),
        exact: false,
      });
    },
  });
}
