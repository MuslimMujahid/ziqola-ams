import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

type TeacherProfile = {
  id: string;
  tenantId: string;
  userId: string;
  nip?: string | null;
  nuptk?: string | null;
  hiredAt?: string | null;
  additionalIdentifiers?: Record<string, unknown> | null;
  user: { id: string; name: string; email: string };
  createdAt?: string | null;
  updatedAt?: string | null;
};

type TeacherProfileRecord = Omit<TeacherProfile, "user">;

type GetTeacherProfilesVars = QueryParams<{}>;

type GetTeacherProfilesResponse = ApiListResponse<TeacherProfile>;

type GetTeacherProfileResponse = ApiResponse<TeacherProfile>;

type CreateTeacherProfileVars = {
  userId: string;
  nip?: string;
  nuptk?: string;
  hiredAt?: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type UpdateTeacherProfileVars = {
  id: string;
  nip?: string;
  nuptk?: string;
  hiredAt?: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type CreateTeacherProfileResponse = ApiResponse<TeacherProfileRecord>;

type UpdateTeacherProfileResponse = ApiResponse<TeacherProfileRecord>;

export type {
  TeacherProfile,
  GetTeacherProfilesVars,
  GetTeacherProfilesResponse,
  GetTeacherProfileResponse,
  CreateTeacherProfileVars,
  UpdateTeacherProfileVars,
  CreateTeacherProfileResponse,
  UpdateTeacherProfileResponse,
  TeacherProfileRecord,
};
