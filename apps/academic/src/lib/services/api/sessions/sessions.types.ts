import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

export type SessionItem = {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  academicPeriodId: string | null;
  academicPeriodName: string | null;
  classSubjectId: string;
  subjectId: string;
  subjectName: string;
  teacherProfileId: string;
  teacherName: string;
  scheduleId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GetSessionsVars = QueryParams<{
  academicPeriodId?: string;
  classId?: string;
  classSubjectId?: string;
  subjectId?: string;
  teacherProfileId?: string;
  scheduleId?: string;
  dateFrom?: string;
  dateTo?: string;
}>;

export type GetSessionsResponse = ApiListResponse<SessionItem>;

export type CreateSessionVars = {
  academicPeriodId?: string;
  scheduleId?: string;
  classSubjectId?: string;
  classId?: string;
  subjectId?: string;
  teacherProfileId?: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type CreateSessionResponse = ApiResponse<SessionItem>;

export type UpdateSessionVars = {
  id: string;
  academicPeriodId?: string;
  scheduleId?: string;
  classSubjectId?: string;
  classId?: string;
  subjectId?: string;
  teacherProfileId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

export type UpdateSessionResponse = ApiResponse<SessionItem>;

export type DeleteSessionVars = {
  id: string;
};

export type DeleteSessionResponse = ApiResponse<{ id: string; date: string }>;
