import type { ApiResponse } from "@/lib/services/api/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Schedule Item (Today's teaching schedule)
// ─────────────────────────────────────────────────────────────────────────────

type TeacherScheduleItem = {
  id: string;
  classId: string;
  className: string;
  classSubjectId: string;
  subjectId: string;
  subjectName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionId: string | null;
  sessionStatus: "not_started" | "in_progress" | "completed" | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Attendance Summary (Today's counts per status)
// ─────────────────────────────────────────────────────────────────────────────

type AttendanceStatus = "PRESENT" | "EXCUSED" | "SICK" | "ABSENT";

type AttendanceSummary = {
  present: number;
  excused: number;
  sick: number;
  absent: number;
  total: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Grading Progress (Per class-subject/period)
// ─────────────────────────────────────────────────────────────────────────────

type GradingProgressItem = {
  classSubjectId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  totalComponents: number;
  completedComponents: number;
  percentComplete: number;
  isLocked: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Pending Task Types
// ─────────────────────────────────────────────────────────────────────────────

type PendingTaskType =
  | "missing_attendance"
  | "ungraded_component"
  | "draft_description";

type PendingTask = {
  id: string;
  type: PendingTaskType;
  title: string;
  description: string;
  classId: string;
  className: string;
  subjectId?: string;
  subjectName?: string;
  dueDate?: string | null;
  link: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Teacher Dashboard Summary (Combined response)
// ─────────────────────────────────────────────────────────────────────────────

type TeacherDashboardSummary = {
  todaySchedule: TeacherScheduleItem[];
  attendanceSummary: AttendanceSummary;
  gradingProgress: GradingProgressItem[];
  pendingTasks: PendingTask[];
  academicPeriod: {
    id: string;
    name: string;
    academicYearLabel: string;
  } | null;
};

type GetTeacherDashboardResponse = ApiResponse<TeacherDashboardSummary>;

export type {
  TeacherScheduleItem,
  AttendanceStatus,
  AttendanceSummary,
  GradingProgressItem,
  PendingTaskType,
  PendingTask,
  TeacherDashboardSummary,
  GetTeacherDashboardResponse,
};
