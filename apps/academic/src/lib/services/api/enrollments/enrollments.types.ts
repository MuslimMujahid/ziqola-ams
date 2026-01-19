import type { ApiResponse } from "@/lib/services/api/api.types";

type Enrollment = {
  id: string;
  studentProfileId: string;
  classId: string;
  academicYearId: string;
  startDate: string;
  endDate?: string | null;
  className?: string | null;
};

type CreateEnrollmentVars = {
  studentProfileId: string;
  classId: string;
  startDate: string;
  endDate?: string;
};

type UpdateEnrollmentVars = {
  id: string;
  endDate?: string;
};

type CreateEnrollmentResponse = ApiResponse<Enrollment>;

type UpdateEnrollmentResponse = ApiResponse<Enrollment>;

export type {
  Enrollment,
  CreateEnrollmentVars,
  UpdateEnrollmentVars,
  CreateEnrollmentResponse,
  UpdateEnrollmentResponse,
};
