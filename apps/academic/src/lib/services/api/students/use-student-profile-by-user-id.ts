import { useQuery } from "@tanstack/react-query";

import { getStudentProfileByUserId } from "./api.client";
import { studentsQueryKeys } from "./students.keys";
import type { GetStudentProfileResponse } from "./students.types";

export function useStudentProfileByUserId(
  userId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<GetStudentProfileResponse>({
    queryKey: studentsQueryKeys.detail(userId),
    queryFn: () => getStudentProfileByUserId(userId),
    enabled: options?.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
