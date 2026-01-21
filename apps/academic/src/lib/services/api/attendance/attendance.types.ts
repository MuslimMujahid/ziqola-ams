import type { ApiResponse } from "@/lib/services/api/api.types";

export type AttendanceStatus = "PRESENT" | "EXCUSED" | "SICK" | "ABSENT";

export type SessionAttendanceStudent = {
  studentProfileId: string;
  studentName: string;
  studentNis?: string | null;
  studentNisn?: string | null;
  status: AttendanceStatus | null;
  remarks?: string | null;
};

export type SessionAttendanceSummary = {
  sessionId: string;
  classId: string;
  date: string;
  students: SessionAttendanceStudent[];
};

export type GetSessionAttendanceResponse =
  ApiResponse<SessionAttendanceSummary>;

export type RecordSessionAttendanceVars = {
  sessionId: string;
  items: Array<{
    studentProfileId: string;
    status: AttendanceStatus;
    remarks?: string | null;
  }>;
};

export type RecordSessionAttendanceResponse =
  ApiResponse<SessionAttendanceSummary>;
