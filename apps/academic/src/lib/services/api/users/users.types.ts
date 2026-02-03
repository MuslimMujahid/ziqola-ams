import type { ApiResponse } from "@/lib/services/api/api.types";
import type { AuthRole } from "@/lib/utils";

export type InviteUserVars = {
  name: string;
  email: string;
  role: AuthRole;
};

export type InviteUserResponse = ApiResponse<{
  user: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: AuthRole;
    status: "INVITED" | "ACTIVE";
    createdAt: string | null;
  };
}>;
