import type {
  ApiListResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

type TeacherProfile = {
  id: string;
  tenantId: string;
  userId: string;
  nip?: string | null;
  nuptk?: string | null;
  user: { id: string; name: string; email: string };
  createdAt?: string | null;
  updatedAt?: string | null;
};

type GetTeacherProfilesVars = QueryParams<{}>;

type GetTeacherProfilesResponse = ApiListResponse<TeacherProfile>;

export type {
  TeacherProfile,
  GetTeacherProfilesVars,
  GetTeacherProfilesResponse,
};
