import type { GetTeacherSubjectsVars } from "./teacher-subjects.types";

const teacherSubjectsQueryKeys = {
  all: ["teacher-subjects"] as const,
  lists: () => [...teacherSubjectsQueryKeys.all, "list"] as const,
  list: (params: GetTeacherSubjectsVars) =>
    [...teacherSubjectsQueryKeys.lists(), params] as const,
};

export { teacherSubjectsQueryKeys };
