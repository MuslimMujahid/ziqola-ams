import type {
  GetAssessmentComponentsVars,
  GetAssessmentTypeWeightsVars,
} from "./assessment-components.types";

const assessmentComponentsQueryKeys = {
  all: ["assessment-components"] as const,
  lists: () => [...assessmentComponentsQueryKeys.all, "list"] as const,
  list: (params: GetAssessmentComponentsVars) =>
    [...assessmentComponentsQueryKeys.lists(), params] as const,
  typeWeights: (params: GetAssessmentTypeWeightsVars) =>
    [...assessmentComponentsQueryKeys.all, "type-weights", params] as const,
};

export { assessmentComponentsQueryKeys };
