import { useQuery } from "@tanstack/react-query";

import { teacherQueryKeys } from "./teachers.keys";
import { getTeacherProfileByUserId } from "./api.client";
import type { GetTeacherProfileResponse } from "./teachers.types";

type UseTeacherProfileByUserOptions = {
  enabled?: boolean;
};

export function useTeacherProfileByUserId(
  userId: string,
  options: UseTeacherProfileByUserOptions,
) {
  return useQuery<GetTeacherProfileResponse>({
    queryKey: teacherQueryKeys.detailByUser(userId),
    queryFn: () => getTeacherProfileByUserId(userId),
    enabled: options.enabled ?? true,
  });
}
