import { queryOptions } from '@tanstack/react-query';
import { clientApi } from "../api";
import { AdminStaffDashboardResponse, GetAdminStaffDashboardSummaryVars } from "./types";
import { ApiResponse } from "../api.types";
import { dashboardQueryKeys } from "./keys";

export async function getAdminStaffDashboardSummary(params?: GetAdminStaffDashboardSummaryVars): Promise<ApiResponse<AdminStaffDashboardResponse>> {
  const response = await clientApi.get<ApiResponse<AdminStaffDashboardResponse>>(
    "/dashboard/admin-staff/summary",
    { params }
  );
  
  return response.data;
}

export const dashboardQueryOptions = {
  adminStaffSummary: (params?: GetAdminStaffDashboardSummaryVars) => queryOptions({
    queryKey: dashboardQueryKeys.adminStaffSummary(params),
    queryFn: () => getAdminStaffDashboardSummary(params),
  })
};
