import type { ApiResponse, EmptyResponse } from "@/lib/services/api/api.types";
import { AuthRole } from "@/lib/utils";

type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  role: AuthRole;
};

type Gender = "MALE" | "FEMALE";

export type { AuthUser };

export type LoginVars = {
  tenantSlug: string;
  role: AuthRole;
  email: string;
  password: string;
};

export type LoginResponse = ApiResponse<{
  user: AuthUser;
  accessToken: string;
}>;

export type MeResponse = ApiResponse<{
  user: AuthUser;
}>;

export type LogoutResponse = EmptyResponse;

export type RegisterVars = {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role: AuthRole;
  gender?: Gender;
  dateOfBirth?: string;
  phoneNumber?: string;
};

export type RegisterResponse = ApiResponse<{
  user: AuthUser & {
    gender?: Gender | null;
    dateOfBirth?: string | null;
    phoneNumber?: string | null;
    createdAt?: string | null;
  };
  accessToken: string;
}>;

export type { Gender };
