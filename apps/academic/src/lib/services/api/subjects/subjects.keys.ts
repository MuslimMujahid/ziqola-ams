import type { GetSubjectsVars } from "./subjects.types";

const subjectsQueryKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectsQueryKeys.all, "list"] as const,
  list: (params?: GetSubjectsVars) =>
    [...subjectsQueryKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...subjectsQueryKeys.all, "detail", id] as const,
};

export { subjectsQueryKeys };
