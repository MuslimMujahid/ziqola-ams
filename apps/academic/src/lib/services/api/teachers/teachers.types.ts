import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";
import type { ProfileFieldValue } from "@/lib/services/api/profile-custom-fields";

type TeacherProfile = {
  id: string;
  tenantId: string;
  userId: string;
  hiredAt?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  additionalIdentifiers?: Record<string, unknown> | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string | null;
  updatedAt?: string | null;
  customFieldValues?: ProfileFieldValue[];
};

type TeacherProfileRecord = Omit<TeacherProfile, "user">;

type GetTeacherProfilesVars = QueryParams<{
  includeCustomFields?: boolean;
}>;

type GetTeacherProfilesResponse = ApiListResponse<TeacherProfile>;

type GetTeacherProfileResponse = ApiResponse<TeacherProfile>;

type CreateTeacherProfileVars = {
  userId: string;
  hiredAt?: string;
  gender?: "MALE" | "FEMALE";
  dateOfBirth?: string;
  phoneNumber?: string;
  additionalIdentifiers?: Record<string, unknown>;
};

type UpdateTeacherProfileVars = {
  id: string;
  hiredAt?: string;
  gender?: "MALE" | "FEMALE";
  dateOfBirth?: string;
  phoneNumber?: string;
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
