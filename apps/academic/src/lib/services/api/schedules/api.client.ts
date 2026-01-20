import { clientApi } from "@/lib/services/api/api";

import type {
  CreateScheduleResponse,
  CreateScheduleVars,
  DeleteScheduleResponse,
  DeleteScheduleVars,
  GetSchedulesResponse,
  GetSchedulesVars,
  UpdateScheduleResponse,
  UpdateScheduleVars,
} from "./schedules.types";

async function getSchedules(params?: GetSchedulesVars) {
  const response = await clientApi.get<GetSchedulesResponse>("/schedules", {
    params,
  });
  return response.data;
}

async function createSchedule(vars: CreateScheduleVars) {
  const response = await clientApi.post<CreateScheduleResponse>(
    "/schedules",
    vars,
  );
  return response.data.data;
}

async function updateSchedule(vars: UpdateScheduleVars) {
  const { id, ...body } = vars;
  const response = await clientApi.patch<UpdateScheduleResponse>(
    `/schedules/${id}`,
    body,
  );
  return response.data.data;
}

async function deleteSchedule(vars: DeleteScheduleVars) {
  const response = await clientApi.delete<DeleteScheduleResponse>(
    `/schedules/${vars.id}`,
  );
  return response.data.data;
}

export { getSchedules, createSchedule, updateSchedule, deleteSchedule };
