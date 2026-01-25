import { clientApi } from "@/lib/services/api/api";
import type {
  AcceptInviteResponse,
  AcceptInviteVars,
  LoginResponse,
  LoginVars,
  LogoutResponse,
  MeResponse,
  RegisterResponse,
  RegisterVars,
} from "@/lib/services/api/auth/auth.types";

export async function login(data: LoginVars): Promise<LoginResponse> {
  const response = await clientApi.post<LoginResponse>("/auth/login", data);
  return response.data;
}

export async function me(): Promise<MeResponse> {
  const response = await clientApi.get<MeResponse>("/auth/me");
  return response.data;
}

export async function logout(): Promise<LogoutResponse> {
  const response = await clientApi.post<LogoutResponse>("/auth/logout");
  return response.data;
}

export async function registerUser(
  data: RegisterVars,
): Promise<RegisterResponse> {
  const response = await clientApi.post<RegisterResponse>(
    "/auth/register",
    data,
  );
  return response.data;
}

export async function acceptInvite(
  data: AcceptInviteVars,
): Promise<AcceptInviteResponse> {
  const response = await clientApi.post<AcceptInviteResponse>(
    "/auth/accept-invite",
    data,
  );
  return response.data;
}
