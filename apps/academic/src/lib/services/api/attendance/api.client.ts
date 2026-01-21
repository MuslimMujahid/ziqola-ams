import { clientApi } from "@/lib/services/api/api";

import type {
  GetSessionAttendanceResponse,
  RecordSessionAttendanceResponse,
  RecordSessionAttendanceVars,
} from "./attendance.types";

async function getSessionAttendance(sessionId: string) {
  const response = await clientApi.get<GetSessionAttendanceResponse>(
    `/sessions/${sessionId}/attendance`,
  );
  return response.data.data;
}

async function recordSessionAttendance(vars: RecordSessionAttendanceVars) {
  const response = await clientApi.put<RecordSessionAttendanceResponse>(
    `/sessions/${vars.sessionId}/attendance`,
    {
      items: vars.items,
    },
  );
  return response.data.data;
}

export { getSessionAttendance, recordSessionAttendance };
