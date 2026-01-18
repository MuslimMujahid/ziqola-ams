import { clientApi } from "@/lib/services/api/api";
import type {
  CheckSchoolCodeResponse,
  CheckSchoolCodeResult,
  RegisterTenantResponse,
  RegisterTenantVars,
} from "@/lib/services/api/tenant/tenant.types";

export async function checkSchoolCodeAvailability(
  schoolCode: string,
): Promise<CheckSchoolCodeResult> {
  const response = await clientApi.get<CheckSchoolCodeResponse>(
    "/tenants/check-school-code",
    {
      params: { schoolCode },
    },
  );

  return response.data.data;
}

export async function registerTenant(
  payload: RegisterTenantVars,
): Promise<RegisterTenantResponse> {
  const response = await clientApi.post<RegisterTenantResponse>(
    "/tenants/register",
    payload,
  );

  return response.data;
}
