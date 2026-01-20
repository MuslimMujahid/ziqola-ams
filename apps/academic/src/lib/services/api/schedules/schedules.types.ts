import type {
  ApiListResponse,
  ApiResponse,
  QueryParams,
} from "@/lib/services/api/api.types";

export type ScheduleItem = {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  academicPeriodId: string;
  academicPeriodName: string;
  classSubjectId: string;
  subjectId: string;
  subjectName: string;
  teacherProfileId: string;
  teacherName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GetSchedulesVars = QueryParams<{
  academicPeriodId?: string;
  classId?: string;
  classSubjectId?: string;
  subjectId?: string;
  teacherProfileId?: string;
  dayOfWeek?: number;
}>;

export type GetSchedulesResponse = ApiListResponse<ScheduleItem>;

export type CreateScheduleVars = {
  academicPeriodId: string;
  classSubjectId?: string;
  classId: string;
  subjectId: string;
  teacherProfileId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type UpdateScheduleVars = {
  id: string;
  academicPeriodId: string;
  classSubjectId?: string;
  classId: string;
  subjectId: string;
  teacherProfileId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type DeleteScheduleVars = {
  id: string;
};

export type CreateScheduleResponse = ApiResponse<ScheduleItem>;
export type UpdateScheduleResponse = ApiResponse<ScheduleItem>;
export type DeleteScheduleResponse = ApiResponse<ScheduleItem>;
