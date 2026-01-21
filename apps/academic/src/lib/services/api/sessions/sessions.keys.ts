import type { GetSessionsFilters, GetSessionsVars } from "./sessions.types";

export const sessionsQueryKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionsQueryKeys.all, "list"] as const,
  list: (params: GetSessionsVars) =>
    [...sessionsQueryKeys.lists(), params] as const,
  listInfinite: (filters: GetSessionsFilters) =>
    [...sessionsQueryKeys.lists(), filters] as const,
  details: () => [...sessionsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionsQueryKeys.details(), id] as const,
};
