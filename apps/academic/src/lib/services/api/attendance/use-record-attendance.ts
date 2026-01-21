import { useMutation, useQueryClient } from "@tanstack/react-query";

import { attendanceQueryKeys } from "./attendance.keys";
import { recordSessionAttendance } from "./api.client";
import type { RecordSessionAttendanceVars } from "./attendance.types";

export function useRecordAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecordSessionAttendanceVars) =>
      recordSessionAttendance(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.session(data.sessionId),
      });
    },
  });
}
