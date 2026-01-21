import { useQuery } from "@tanstack/react-query";

import { getSessionAttendance } from "./api.client";
import { attendanceQueryKeys } from "./attendance.keys";
import type { SessionAttendanceSummary } from "./attendance.types";

type UseSessionAttendanceOptions = {
  enabled?: boolean;
};

export function useSessionAttendance(
  sessionId: string,
  options?: UseSessionAttendanceOptions,
) {
  return useQuery<SessionAttendanceSummary>({
    queryKey: attendanceQueryKeys.session(sessionId),
    queryFn: () => getSessionAttendance(sessionId),
    enabled: options?.enabled ?? Boolean(sessionId),
  });
}
