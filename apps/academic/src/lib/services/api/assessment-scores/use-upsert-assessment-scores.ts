import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertAssessmentScores } from "./api.client";
import { assessmentScoresQueryKeys } from "./assessment-scores.keys";
import type { UpsertAssessmentScoresVars } from "./assessment-scores.types";

export function useUpsertAssessmentScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertAssessmentScoresVars) =>
      upsertAssessmentScores(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assessmentScoresQueryKeys.list({
          componentId: variables.componentId,
        }),
      });
    },
  });
}
