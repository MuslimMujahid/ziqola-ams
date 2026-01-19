import type { GetTeacherProfilesVars } from "./teachers.types";

const teacherQueryKeys = {
  all: ["teachers"] as const,
  lists: () => [...teacherQueryKeys.all, "list"] as const,
  list: (params?: GetTeacherProfilesVars) =>
    [...teacherQueryKeys.lists(), params ?? {}] as const,
};

export { teacherQueryKeys };
