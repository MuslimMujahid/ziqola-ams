import type {
  LoginResponse,
  LoginVars,
  MeResponse,
} from "@/lib/services/api/auth";
import type { AuthUser } from "@/lib/services/api/auth";
import { useAppSession } from "@/lib/utils/session.server";
import { isApiError, serverApi } from "../services/api";

export async function loginAndCreateSession(data: LoginVars) {
  try {
    const response = await serverApi.post<LoginResponse>("/auth/login", data);
    const { user, accessToken } = response.data.data;

    const session = await useAppSession();
    await session.update({ accessToken, user });

    return { user, accessToken };
  } catch (error) {
    if (isApiError(error)) {
      const message =
        error.response?.data?.message ?? error.message ?? "Login failed";
      throw new Error(message);
    }

    throw error;
  }
}

export async function logoutSession() {
  const session = await useAppSession();
  await session.clear();
  return { success: true };
}

export async function getCurrentUser() {
  const session = await useAppSession();

  if (!session.data.accessToken) {
    return null;
  }

  if (session.data.user) {
    return session.data.user as AuthUser;
  }

  try {
    const response = await serverApi.get<MeResponse>("/auth/me", {
      headers: {
        Authorization: `Bearer ${session.data.accessToken}`,
      },
    });

    const user = response.data.data.user;
    await session.update({ user });
    return user;
  } catch {
    await session.clear();
    return null;
  }
}
