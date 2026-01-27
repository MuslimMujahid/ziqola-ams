import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAssessmentComponent } from "./api.client";
import { assessmentComponentsQueryKeys } from "./assessment-components.keys";
import type { CreateAssessmentComponentVars } from "./assessment-components.types";

export function useCreateAssessmentComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAssessmentComponentVars) =>
      createAssessmentComponent(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentComponentsQueryKeys.list({
          classSubjectId: variables.classSubjectId,
          academicPeriodId: variables.academicPeriodId,
        }),
      });
    },
  });
}
