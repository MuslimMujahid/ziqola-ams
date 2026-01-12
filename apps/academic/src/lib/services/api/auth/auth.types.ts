import type { ApiResponse, EmptyResponse } from "@/lib/services/api/api.types";
import { AuthRole } from "@/lib/utils";

type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  name?: string | null;
  role: AuthRole;
};

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
