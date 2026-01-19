import { useQuery } from "@tanstack/react-query";

import { teacherQueryKeys } from "./teachers.keys";
import { getTeacherProfileById } from "./api.client";
import type { GetTeacherProfileResponse } from "./teachers.types";

type UseTeacherProfileOptions = {
  enabled?: boolean;
};

export function useTeacherProfile(
  id: string,
  options: UseTeacherProfileOptions,
) {
  return useQuery<GetTeacherProfileResponse>({
    queryKey: teacherQueryKeys.detail(id),
    queryFn: () => getTeacherProfileById(id),
    enabled: options.enabled ?? true,
  });
}
