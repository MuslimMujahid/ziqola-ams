import type { ApiResponse } from "@/lib/services/api/api.types";

export type AssessmentScoreStudent = {
  studentProfileId: string;
  studentName: string;
  score: number | null;
  isLocked: boolean;
};

export type AssessmentScoreSummary = {
  component: {
    id: string;
    name: string;
    assessmentTypeId: string;
    assessmentTypeLabel: string;
  };
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  academicPeriod: {
    id: string;
    name: string;
  };
  students: AssessmentScoreStudent[];
};

export type GetAssessmentScoresVars = {
  componentId: string;
};

export type UpsertAssessmentScoresVars = {
  componentId: string;
  items: Array<{
    studentProfileId: string;
    score: number | null;
  }>;
};

export type GetAssessmentScoresResponse = ApiResponse<AssessmentScoreSummary>;
export type UpsertAssessmentScoresResponse =
  ApiResponse<AssessmentScoreSummary>;
