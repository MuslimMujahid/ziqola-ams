import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertAssessmentTypeWeight } from "./api.client";
import { assessmentComponentsQueryKeys } from "./assessment-components.keys";
import type { UpsertAssessmentTypeWeightVars } from "./assessment-components.types";

export function useUpsertAssessmentTypeWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertAssessmentTypeWeightVars) =>
      upsertAssessmentTypeWeight(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentComponentsQueryKeys.typeWeights({
          teacherSubjectId: variables.teacherSubjectId,
          academicPeriodId: variables.academicPeriodId,
        }),
      });
    },
  });
}
