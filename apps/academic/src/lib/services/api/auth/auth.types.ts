import type { ApiResponse, EmptyResponse } from "@/lib/services/api/api.types";
import { AuthRole } from "@/lib/utils";

type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  role: AuthRole;
  isHomeroomTeacher?: boolean;
};

export type { AuthUser };

export type LoginVars = {
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
  name: string;
  role: AuthRole;
};

export type RegisterResponse = ApiResponse<{
  user: AuthUser & {
    createdAt?: string | null;
  };
}>;

export type AcceptInviteVars = {
  token: string;
  password: string;
};

export type AcceptInviteResponse = ApiResponse<{
  user: AuthUser & {
    status?: string | null;
  };
}>;
