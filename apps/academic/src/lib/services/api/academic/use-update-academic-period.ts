import { useMutation, useQueryClient } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { updateAcademicPeriod } from "./api.client";
import type { UpdateAcademicPeriodVars } from "./academic.types";

export function useUpdateAcademicPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAcademicPeriodVars) =>
      updateAcademicPeriod(payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.context() });
      queryClient.invalidateQueries({
        queryKey: academicQueryKeys.periods(),
        exact: false,
      });
      if (vars.id) {
        queryClient.invalidateQueries({
          queryKey: academicQueryKeys.period(vars.id),
        });
      }
    },
  });
}
