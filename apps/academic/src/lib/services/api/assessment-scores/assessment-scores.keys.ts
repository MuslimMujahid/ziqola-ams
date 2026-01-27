import type { GetAssessmentScoresVars } from "./assessment-scores.types";

const assessmentScoresQueryKeys = {
  all: ["assessment-scores"] as const,
  lists: () => [...assessmentScoresQueryKeys.all, "list"] as const,
  list: (params: GetAssessmentScoresVars) =>
    [...assessmentScoresQueryKeys.lists(), params] as const,
};

export { assessmentScoresQueryKeys };
