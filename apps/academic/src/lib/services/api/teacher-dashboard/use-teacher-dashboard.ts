import { useQuery } from "@tanstack/react-query";

import { getTeacherDashboardSummary } from "./api.client";
import { teacherDashboardQueryKeys } from "./teacher-dashboard.keys";
import type { TeacherDashboardSummary } from "./teacher-dashboard.types";

export function useTeacherDashboard(options?: { enabled?: boolean }) {
  return useQuery<TeacherDashboardSummary>({
    queryKey: teacherDashboardQueryKeys.summary(),
    queryFn: () => getTeacherDashboardSummary(),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}
