import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import type { RegisterTenantVars } from "@/lib/services/api/tenant/tenant.types";
import { registerTenantAndCreateSession } from "@/lib/utils/auth.server";

const EDUCATION_LEVEL_VALUES = ["SD", "SMP", "SMA", "SMK", "OTHER"] as const;

const registerTenantSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(2, "School name is required")
    .max(160, "School name is too long"),
  educationLevel: z.enum(EDUCATION_LEVEL_VALUES),
  admin: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name is required")
      .max(120, "Full name is too long"),
    email: z.string().trim().email("Email is invalid"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const registerTenantFn = createServerFn({ method: "POST" })
  .inputValidator((data: RegisterTenantVars) =>
    registerTenantSchema.parse(data),
  )
  .handler(async ({ data }) => registerTenantAndCreateSession(data));
