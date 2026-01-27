import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getTeacherSubjects } from "./api.client";
import { teacherSubjectsQueryKeys } from "./teacher-subjects.keys";
import type {
  GetTeacherSubjectsResponse,
  GetTeacherSubjectsVars,
} from "./teacher-subjects.types";

export function useTeacherSubjects(
  params: GetTeacherSubjectsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetTeacherSubjectsResponse>({
    queryKey: teacherSubjectsQueryKeys.list(params),
    queryFn: () => getTeacherSubjects(params),
    enabled: options?.enabled ?? true,
  });
}

export function useSuspenseTeacherSubjects(params: GetTeacherSubjectsVars) {
  return useSuspenseQuery<GetTeacherSubjectsResponse>({
    queryKey: teacherSubjectsQueryKeys.list(params),
    queryFn: () => getTeacherSubjects(params),
  });
}
