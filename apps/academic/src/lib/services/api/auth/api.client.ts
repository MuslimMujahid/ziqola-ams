import { clientApi } from "@/lib/services/api/api";
import type {
  LoginResponse,
  LoginVars,
  LogoutResponse,
  MeResponse,
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
