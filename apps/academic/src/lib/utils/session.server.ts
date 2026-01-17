import { useSession } from "@tanstack/react-start/server";
import type { AuthUser } from "@/lib/services/api/auth";

export type AuthSessionData = {
  accessToken?: string;
  user?: AuthUser | null;
};

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-session-secret-change-me-to-32-characters";

export async function useAppSession() {
  return await useSession<AuthSessionData>({
    name: "ziqola-auth",
    password: SESSION_SECRET,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  });
}
