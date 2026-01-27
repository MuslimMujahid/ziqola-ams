import type { ApiResponse } from "@/lib/services/api/api.types";

export type AssessmentTypeSummary = {
  id: string;
  key: string;
  label: string;
  isEnabled: boolean;
};

export type AssessmentComponent = {
  id: string;
  tenantId: string;
  classSubjectId: string;
  academicPeriodId: string;
  assessmentTypeId: string;
  assessmentType: AssessmentTypeSummary;
  name: string;
  scoreSummary: {
    totalStudents: number;
    scoredStudents: number;
    isComplete: boolean;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AssessmentTypeWeight = {
  id: string;
  tenantId: string;
  teacherSubjectId: string;
  academicPeriodId: string;
  assessmentTypeId: string;
  weight: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GetAssessmentComponentsVars = {
  classSubjectId: string;
  academicPeriodId: string;
};

export type CreateAssessmentComponentVars = {
  classSubjectId: string;
  academicPeriodId: string;
  assessmentTypeId: string;
  name: string;
};

export type UpdateAssessmentComponentVars = {
  id: string;
  name?: string;
  assessmentTypeId?: string;
};

export type DeleteAssessmentComponentVars = {
  id: string;
};

export type GetAssessmentTypeWeightsVars = {
  teacherSubjectId: string;
  academicPeriodId: string;
};

export type UpsertAssessmentTypeWeightVars = {
  teacherSubjectId: string;
  academicPeriodId: string;
  assessmentTypeId: string;
  weight: number;
};

export type GetAssessmentComponentsResponse = ApiResponse<
  AssessmentComponent[]
>;
export type CreateAssessmentComponentResponse =
  ApiResponse<AssessmentComponent>;
export type UpdateAssessmentComponentResponse =
  ApiResponse<AssessmentComponent>;
export type DeleteAssessmentComponentResponse = ApiResponse<{ id: string }>;

export type AssessmentTypeWeightPayload = {
  weights: AssessmentTypeWeight[];
  totalWeight: number;
};

export type GetAssessmentTypeWeightsResponse =
  ApiResponse<AssessmentTypeWeightPayload>;
export type UpsertAssessmentTypeWeightResponse =
  ApiResponse<AssessmentTypeWeightPayload>;
