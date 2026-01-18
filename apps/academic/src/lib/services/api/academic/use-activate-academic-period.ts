import { useMutation, useQueryClient } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { activateAcademicPeriod } from "./api.client";
import type { ActivateAcademicPeriodVars } from "./academic.types";

export function useActivateAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ActivateAcademicPeriodVars) =>
      activateAcademicPeriod(payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.context() });
      queryClient.invalidateQueries({
        queryKey: academicQueryKeys.periods(),
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.years() });
    },
  });
}
