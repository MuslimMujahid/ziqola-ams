import type { GetClassesVars } from "./classes.types";

const classesQueryKeys = {
  all: ["classes"] as const,
  lists: () => [...classesQueryKeys.all, "list"] as const,
  list: (params?: GetClassesVars) =>
    [...classesQueryKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...classesQueryKeys.all, "detail", id] as const,
};

export { classesQueryKeys };
