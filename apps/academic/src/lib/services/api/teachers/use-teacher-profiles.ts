import { useQuery } from "@tanstack/react-query";

import { teacherQueryKeys } from "./teachers.keys";
import { getTeacherProfiles } from "./api.client";
import type {
  GetTeacherProfilesResponse,
  GetTeacherProfilesVars,
} from "./teachers.types";

export function useTeacherProfiles(
  params: GetTeacherProfilesVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetTeacherProfilesResponse>({
    queryKey: teacherQueryKeys.list(params),
    queryFn: () => getTeacherProfiles(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
