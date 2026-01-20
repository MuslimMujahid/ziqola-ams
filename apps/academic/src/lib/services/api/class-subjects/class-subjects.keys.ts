import type { GetClassSubjectsVars } from "./class-subjects.types";

const classSubjectsQueryKeys = {
  all: ["class-subjects"] as const,
  lists: () => [...classSubjectsQueryKeys.all, "list"] as const,
  list: (params?: GetClassSubjectsVars) =>
    [...classSubjectsQueryKeys.lists(), params ?? {}] as const,
  detail: (id: string) =>
    [...classSubjectsQueryKeys.all, "detail", id] as const,
};

export { classSubjectsQueryKeys };
