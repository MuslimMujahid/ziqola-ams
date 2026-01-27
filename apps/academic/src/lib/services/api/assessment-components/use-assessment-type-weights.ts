import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getAssessmentTypeWeights } from "./api.client";
import { assessmentComponentsQueryKeys } from "./assessment-components.keys";
import type {
  GetAssessmentTypeWeightsResponse,
  GetAssessmentTypeWeightsVars,
} from "./assessment-components.types";

export function useAssessmentTypeWeights(
  params: GetAssessmentTypeWeightsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetAssessmentTypeWeightsResponse>({
    queryKey: assessmentComponentsQueryKeys.typeWeights(params),
    queryFn: () => getAssessmentTypeWeights(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSuspenseAssessmentTypeWeights(
  params: GetAssessmentTypeWeightsVars,
) {
  return useSuspenseQuery<GetAssessmentTypeWeightsResponse>({
    queryKey: assessmentComponentsQueryKeys.typeWeights(params),
    queryFn: () => getAssessmentTypeWeights(params),
  });
}
