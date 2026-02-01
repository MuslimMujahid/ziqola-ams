import type { GetTeacherAssessmentRecapVars } from "./assessment-recap.types";

const assessmentRecapQueryKeys = {
  all: ["assessment-recap"] as const,
  detail: (params: GetTeacherAssessmentRecapVars) =>
    [...assessmentRecapQueryKeys.all, params] as const,
};

export { assessmentRecapQueryKeys };
