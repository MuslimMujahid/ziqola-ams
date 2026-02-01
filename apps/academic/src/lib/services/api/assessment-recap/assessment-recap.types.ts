import type { ApiResponse } from "../api.types";

type AssessmentRecapPeriod = {
  id: string;
  name: string;
  academicYearLabel: string;
};

type AssessmentRecapClass = {
  id: string;
  name: string;
  kkm: number;
};

type AssessmentRecapSubject = {
  id: string;
  name: string;
};

type AssessmentRecapAssessmentType = {
  id: string;
  label: string;
};

type AssessmentRecapClassSubject = {
  id: string;
  classId: string;
  subjectId: string;
  kkm: number;
};

type AssessmentRecapComponentScore = {
  componentId: string;
  componentName: string;
  assessmentTypeId: string;
  assessmentTypeLabel: string;
  score: number | null;
};

type AssessmentRecapStudent = {
  id: string;
  studentProfileId: string;
  studentName: string;
  nis: string | null;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  periodId: string;
  finalScore: number;
  componentScores?: AssessmentRecapComponentScore[];
};

type AssessmentRecapSummary = {
  average: number;
  median: number;
  passRate: number;
  remedialCount: number;
  totalStudents: number;
  maxScore: number;
  minScore: number;
};

type AssessmentRecapReadiness = {
  missingScoreCount: number;
  missingStudentCount: number;
  weightTotal: number;
  isWeightValid: boolean;
  isReady: boolean;
};

type AssessmentRecapSubmission = {
  id: string;
  status: "submitted" | "returned" | "resubmitted";
  submittedAt: string;
  returnedAt: string | null;
  teacherProfileId: string;
};

type AssessmentRecapChangeRequest = {
  id: string;
  status: string;
  requestedAt: string;
  teacherProfileId: string;
};

type TeacherAssessmentRecap = {
  activePeriodId: string | null;
  periods: AssessmentRecapPeriod[];
  classes: AssessmentRecapClass[];
  subjects: AssessmentRecapSubject[];
  assessmentTypes: AssessmentRecapAssessmentType[];
  classSubjects: AssessmentRecapClassSubject[];
  students: AssessmentRecapStudent[];
  summary: AssessmentRecapSummary;
  hasSubmittedRecap: boolean;
  readiness: AssessmentRecapReadiness | null;
  submission: AssessmentRecapSubmission | null;
  changeRequest: AssessmentRecapChangeRequest | null;
};

type GetTeacherAssessmentRecapResponse = ApiResponse<TeacherAssessmentRecap>;

type GetTeacherAssessmentRecapVars = {
  periodId?: string;
  classId?: string;
  subjectId?: string;
};

type SubmitTeacherAssessmentRecapVars = {
  periodId: string;
  classId: string;
  subjectId: string;
};

type SubmitTeacherAssessmentRecapResponse = ApiResponse<{
  submission: AssessmentRecapSubmission;
  readiness: AssessmentRecapReadiness;
}>;

type UpdateTeacherAssessmentRecapKkmVars = {
  classSubjectId: string;
  kkm: number;
};

type UpdateTeacherAssessmentRecapKkmResponse = ApiResponse<{
  classSubjectId: string;
  kkm: number;
}>;

type RequestTeacherAssessmentRecapChangeVars = {
  classSubjectId: string;
  periodId: string;
};

type RequestTeacherAssessmentRecapChangeResponse =
  ApiResponse<AssessmentRecapChangeRequest>;

export type {
  AssessmentRecapPeriod,
  AssessmentRecapClass,
  AssessmentRecapSubject,
  AssessmentRecapClassSubject,
  AssessmentRecapAssessmentType,
  AssessmentRecapComponentScore,
  AssessmentRecapStudent,
  AssessmentRecapSummary,
  AssessmentRecapReadiness,
  AssessmentRecapSubmission,
  AssessmentRecapChangeRequest,
  TeacherAssessmentRecap,
  GetTeacherAssessmentRecapResponse,
  GetTeacherAssessmentRecapVars,
  SubmitTeacherAssessmentRecapVars,
  SubmitTeacherAssessmentRecapResponse,
  UpdateTeacherAssessmentRecapKkmVars,
  UpdateTeacherAssessmentRecapKkmResponse,
  RequestTeacherAssessmentRecapChangeVars,
  RequestTeacherAssessmentRecapChangeResponse,
};
