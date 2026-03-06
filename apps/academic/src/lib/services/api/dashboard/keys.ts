import type { GetAdminStaffDashboardSummaryVars } from "./types";

// Following api-request.instructions.md for query keys
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  adminStaffSummary: (params?: GetAdminStaffDashboardSummaryVars) =>
    [...dashboardQueryKeys.all, "adminStaffSummary", params] as const,
};
