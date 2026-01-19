import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

type StudentClassSummary = {
  id: string;
  name: string;
  academicYearId?: string | null;
  academicYearLabel?: string | null;
};

type StudentListItem = {
  id: string;
  tenantId: string;
  userId: string;
  nis?: string | null;
  nisn?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  currentClass?: StudentClassSummary | null;
};

type GetStudentsVars = QueryParams<{
  academicYearId?: string;
  classId?: string;
  withoutClass?: boolean;
  order?: "asc" | "desc";
}>;

type GetStudentsResponse = ApiListResponse<StudentListItem>;

type StudentProfile = {
  id: string;
  tenantId: string;
  userId: string;
  nis?: string | null;
  nisn?: string | null;
  additionalIdentifiers?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CreateStudentProfileVars = {
  userId: string;
  nis?: string;
  nisn?: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type UpdateStudentProfileVars = {
  id: string;
  nis?: string;
  nisn?: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type CreateStudentProfileResponse = ApiResponse<StudentProfile>;

type UpdateStudentProfileResponse = ApiResponse<StudentProfile>;

export type {
  StudentClassSummary,
  StudentListItem,
  GetStudentsVars,
  GetStudentsResponse,
  StudentProfile,
  CreateStudentProfileVars,
  UpdateStudentProfileVars,
  CreateStudentProfileResponse,
  UpdateStudentProfileResponse,
};
