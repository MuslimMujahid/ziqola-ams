import type { ApiResponse } from "@/lib/services/api/api.types";
import type { AuthRole } from "@/lib/utils";
import type { Gender } from "@/lib/services/api/auth";

export type InviteUserVars = {
  name: string;
  email: string;
  role: AuthRole;
  gender?: Gender;
  dateOfBirth?: string;
  phoneNumber?: string;
};

export type InviteUserResponse = ApiResponse<{
  user: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: AuthRole;
    gender?: Gender | null;
    dateOfBirth?: string | null;
    phoneNumber?: string | null;
    status: "INVITED" | "ACTIVE";
    createdAt: string | null;
  };
}>;
