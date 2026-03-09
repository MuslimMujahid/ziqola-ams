import type { ApiResponse } from "@/lib/services/api/api.types";
import type { AuthUser } from "@/lib/services/api/auth";

type EducationLevel = "SD" | "SMP" | "SMA" | "SMK" | "OTHER";

type RegisterTenantAdminInput = {
  fullName: string;
  email: string;
  password: string;
};

type RegisterTenantVars = {
  schoolCode: string;
  schoolName: string;
  educationLevel: EducationLevel;
  admin: RegisterTenantAdminInput;
};

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  educationLevel?: EducationLevel | null;
};

type RegisterTenantResult = {
  tenant: TenantSummary;
  user: AuthUser;
  accessToken: string;
};

type RegisterTenantSessionResult = {
  user: AuthUser;
  accessToken: string;
};

type RegisterTenantResponse = ApiResponse<RegisterTenantResult>;

type CheckSchoolCodeResult = {
  available: boolean;
};

type CheckSchoolCodeResponse = ApiResponse<CheckSchoolCodeResult>;

type CheckEmailResult = {
  available: boolean;
};

type CheckEmailResponse = ApiResponse<CheckEmailResult>;

export type {
  EducationLevel,
  RegisterTenantAdminInput,
  RegisterTenantVars,
  TenantSummary,
  RegisterTenantResult,
  RegisterTenantSessionResult,
  RegisterTenantResponse,
  CheckSchoolCodeResult,
  CheckSchoolCodeResponse,
  CheckEmailResult,
  CheckEmailResponse,
};
