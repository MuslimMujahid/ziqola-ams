import { useQuery } from "@tanstack/react-query";

import { studentsQueryKeys } from "./students.keys";
import { getStudents } from "./api.client";
import type { GetStudentsResponse, GetStudentsVars } from "./students.types";

type UseStudentsOptions = {
  enabled?: boolean;
};

export function useStudents(
  params: GetStudentsVars,
  options: UseStudentsOptions = {},
) {
  return useQuery<GetStudentsResponse>({
    queryKey: studentsQueryKeys.list(params),
    queryFn: () => getStudents(params),
    placeholderData: (previous) => previous,
    enabled: options.enabled ?? true,
  });
}
