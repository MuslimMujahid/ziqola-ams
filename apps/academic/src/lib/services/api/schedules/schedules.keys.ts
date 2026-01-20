import type { GetSchedulesVars } from "./schedules.types";

export const schedulesQueryKeys = {
  all: ["schedules"] as const,
  lists: () => [...schedulesQueryKeys.all, "list"] as const,
  list: (params: GetSchedulesVars) =>
    [...schedulesQueryKeys.lists(), params] as const,
  details: () => [...schedulesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...schedulesQueryKeys.details(), id] as const,
};
