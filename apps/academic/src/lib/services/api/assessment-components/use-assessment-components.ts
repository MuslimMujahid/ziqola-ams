import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getAssessmentComponents } from "./api.client";
import { assessmentComponentsQueryKeys } from "./assessment-components.keys";
import type {
  GetAssessmentComponentsResponse,
  GetAssessmentComponentsVars,
} from "./assessment-components.types";

export function useAssessmentComponents(
  params: GetAssessmentComponentsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetAssessmentComponentsResponse>({
    queryKey: assessmentComponentsQueryKeys.list(params),
    queryFn: () => getAssessmentComponents(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSuspenseAssessmentComponents(
  params: GetAssessmentComponentsVars,
) {
  return useSuspenseQuery<GetAssessmentComponentsResponse>({
    queryKey: assessmentComponentsQueryKeys.list(params),
    queryFn: () => getAssessmentComponents(params),
  });
}
