// Following api-request.instructions.md for query keys
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  adminStaffSummary: () => [...dashboardQueryKeys.all, "adminStaffSummary"] as const,
};
