import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

export type ClassSubject = {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearLabel: string;
  subjectId: string;
  subjectName: string;
  teacherProfileId: string;
  teacherUserId: string;
  teacherName: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  isDeleted?: boolean;
  deleted?: "soft" | "hard";
};

export type GetClassSubjectsVars = QueryParams<{
  academicYearId?: string;
  classId?: string;
  subjectId?: string;
  teacherProfileId?: string;
}>;

export type GetClassSubjectsResponse = ApiListResponse<ClassSubject>;

export type CreateClassSubjectVars = {
  classId: string;
  academicYearId: string;
  subjectId: string;
  teacherProfileId: string;
};

export type UpdateClassSubjectVars = {
  id: string;
  teacherProfileId: string;
};

export type DeleteClassSubjectVars = {
  id: string;
};

export type CreateClassSubjectResponse = ApiResponse<ClassSubject>;

export type UpdateClassSubjectResponse = ApiResponse<ClassSubject>;

export type DeleteClassSubjectResponse = ApiResponse<ClassSubject>;
