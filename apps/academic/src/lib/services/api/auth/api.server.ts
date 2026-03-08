import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import type { LoginVars } from "@/lib/services/api/auth";
import {
  getCurrentUser,
  loginAndCreateSession,
  logoutSession,
} from "../../../utils/auth.server";

const AUTH_ROLE_VALUES = [
  "PRINCIPAL",
  "ADMIN_STAFF",
  "TEACHER",
  "STUDENT",
] as const;

const loginServerSchema = z.object({
  role: z.enum(AUTH_ROLE_VALUES),
  email: z.email(),
  password: z.string().min(1),
});

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: LoginVars) => loginServerSchema.parse(data))
  .handler(async ({ data }) => loginAndCreateSession(data));

export const logoutFn = createServerFn({ method: "POST" }).handler(() =>
  logoutSession(),
);

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(() =>
  getCurrentUser(),
);
