import type { ApiResponse, QueryParams } from "@/lib/services/api/api.types";

export type TeacherSubject = {
  id: string;
  tenantId: string;
  teacherProfileId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GetTeacherSubjectsVars = QueryParams<{
  academicYearId: string;
  teacherProfileId?: string;
}>;

export type GetTeacherSubjectsResponse = ApiResponse<TeacherSubject[]>;
