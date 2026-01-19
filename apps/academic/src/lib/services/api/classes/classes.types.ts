import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";
import type { GroupType } from "@/lib/services/api/groups";

type ClassGroup = {
  id: string;
  name: string;
  type: GroupType;
};

type HomeroomTeacher = {
  assignmentId: string;
  teacherProfileId: string;
  userId: string;
  name: string;
  assignedAt: string;
};

type ClassItem = {
  id: string;
  tenantId: string;
  name: string;
  academicYearId: string;
  academicYear: { id: string; label: string } | null;
  groups: ClassGroup[];
  homeroomTeacher: HomeroomTeacher | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GetClassesVars = QueryParams<{
  academicYearId?: string;
  groupId?: string;
  order?: "asc" | "desc";
}>;

type GetClassesResponse = ApiListResponse<ClassItem>;

type CreateClassVars = {
  name: string;
  academicYearId: string;
  groupIds?: string[];
};

type UpdateClassVars = {
  id: string;
  name?: string;
  groupIds?: string[];
};

type DeleteClassVars = {
  id: string;
};

type AssignHomeroomVars = {
  id: string;
  teacherProfileId: string;
};

type HomeroomAssignment = {
  assignmentId: string;
  teacherProfileId: string;
  userId: string;
  name: string;
  assignedAt: string;
};

type CreateClassResponse = ApiResponse<ClassItem>;

type UpdateClassResponse = ApiResponse<ClassItem>;

type DeleteClassResponse = ApiResponse<{ id: string; name: string }>;

type AssignHomeroomResponse = ApiResponse<HomeroomAssignment>;

export type {
  ClassItem,
  ClassGroup,
  HomeroomTeacher,
  HomeroomAssignment,
  GetClassesVars,
  GetClassesResponse,
  CreateClassVars,
  UpdateClassVars,
  DeleteClassVars,
  AssignHomeroomVars,
  CreateClassResponse,
  UpdateClassResponse,
  DeleteClassResponse,
  AssignHomeroomResponse,
};
