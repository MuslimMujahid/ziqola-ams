import type { GetGroupsVars } from "./groups.types";

const groupsQueryKeys = {
  all: ["groups"] as const,
  lists: () => [...groupsQueryKeys.all, "list"] as const,
  list: (params?: GetGroupsVars) =>
    [...groupsQueryKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...groupsQueryKeys.all, "detail", id] as const,
};

export { groupsQueryKeys };
