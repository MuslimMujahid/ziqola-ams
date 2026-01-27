import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { assessmentScoresQueryKeys } from "./assessment-scores.keys";
import type {
  AssessmentScoreSummary,
  GetAssessmentScoresVars,
} from "./assessment-scores.types";
import { getAssessmentScoresFn } from "./api.server";

export function useAssessmentScores(
  params: GetAssessmentScoresVars,
  options?: { enabled?: boolean },
) {
  return useQuery<AssessmentScoreSummary>({
    queryKey: assessmentScoresQueryKeys.list(params),
    queryFn: () => getAssessmentScoresFn({ data: params }),
    enabled: options?.enabled ?? true,
  });
}

export function useSuspenseAssessmentScores(params: GetAssessmentScoresVars) {
  return useSuspenseQuery<AssessmentScoreSummary>({
    queryKey: assessmentScoresQueryKeys.list(params),
    queryFn: () => getAssessmentScoresFn({ data: params }),
  });
}
