import type { GetStudentsVars } from "./students.types";

const studentsQueryKeys = {
  all: ["students"] as const,
  lists: () => [...studentsQueryKeys.all, "list"] as const,
  list: (params?: GetStudentsVars) =>
    [...studentsQueryKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...studentsQueryKeys.all, "detail", id] as const,
};

export { studentsQueryKeys };
