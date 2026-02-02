import type {
  GetHomeroomAssessmentRecapVars,
  GetTeacherAssessmentRecapVars,
} from "./assessment-recap.types";

const assessmentRecapQueryKeys = {
  all: ["assessment-recap"] as const,
  detail: (params: GetTeacherAssessmentRecapVars) =>
    [...assessmentRecapQueryKeys.all, params] as const,
  homeroomList: (params: GetHomeroomAssessmentRecapVars) =>
    [...assessmentRecapQueryKeys.all, "homeroom", params] as const,
  homeroomOptions: () =>
    [...assessmentRecapQueryKeys.all, "homeroom", "options"] as const,
  homeroomDetail: (submissionId: string) =>
    [...assessmentRecapQueryKeys.all, "homeroom", submissionId] as const,
};

export { assessmentRecapQueryKeys };
