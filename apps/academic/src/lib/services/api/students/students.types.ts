import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";
import type { ProfileFieldValue } from "@/lib/services/api/profile-custom-fields";

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
  createdAt?: string | null;
  updatedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  currentClass?: StudentClassSummary | null;
  customFieldValues?: ProfileFieldValue[];
};

type GetStudentsVars = QueryParams<{
  academicYearId?: string;
  classId?: string;
  withoutClass?: boolean;
  order?: "asc" | "desc";
  includeCustomFields?: boolean;
}>;

type GetStudentsResponse = ApiListResponse<StudentListItem>;
type GetStudentProfileResponse = ApiResponse<StudentProfile>;

type StudentProfile = {
  id: string;
  tenantId: string;
  userId: string;
  additionalIdentifiers?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CreateStudentProfileVars = {
  userId: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type UpdateStudentProfileVars = {
  id: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type CreateStudentProfileResponse = ApiResponse<StudentProfile>;

type UpdateStudentProfileResponse = ApiResponse<StudentProfile>;

export type {
  StudentClassSummary,
  StudentListItem,
  GetStudentsVars,
  GetStudentsResponse,
  GetStudentProfileResponse,
  StudentProfile,
  CreateStudentProfileVars,
  UpdateStudentProfileVars,
  CreateStudentProfileResponse,
  UpdateStudentProfileResponse,
};
