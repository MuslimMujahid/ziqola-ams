import { queryOptions } from '@tanstack/react-query';
import { clientApi } from "../api";
import { AdminStaffDashboardResponse } from "./types";
import { ApiResponse } from "../api.types";
import { dashboardQueryKeys } from "./keys";

export async function getAdminStaffDashboardSummary(): Promise<ApiResponse<AdminStaffDashboardResponse>> {
  const response = await clientApi.get<ApiResponse<AdminStaffDashboardResponse>>(
    "/dashboard/admin-staff/summary"
  );
  
  return response.data;
}

export const dashboardQueryOptions = {
  adminStaffSummary: () => queryOptions({
    queryKey: dashboardQueryKeys.adminStaffSummary(),
    queryFn: () => getAdminStaffDashboardSummary(),
  })
};
