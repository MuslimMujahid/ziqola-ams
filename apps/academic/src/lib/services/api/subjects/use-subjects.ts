import { useQuery } from "@tanstack/react-query";

import { getSubjects } from "./api.client";
import { subjectsQueryKeys } from "./subjects.keys";
import type { GetSubjectsResponse, GetSubjectsVars } from "./subjects.types";

export function useSubjects(
  params: GetSubjectsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetSubjectsResponse>({
    queryKey: subjectsQueryKeys.list(params),
    queryFn: () => getSubjects(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
