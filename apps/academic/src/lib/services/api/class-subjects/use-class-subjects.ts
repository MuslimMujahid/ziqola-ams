import { useQuery } from "@tanstack/react-query";

import { getClassSubjects } from "./api.client";
import { classSubjectsQueryKeys } from "./class-subjects.keys";
import type {
  GetClassSubjectsResponse,
  GetClassSubjectsVars,
} from "./class-subjects.types";

export function useClassSubjects(
  params: GetClassSubjectsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetClassSubjectsResponse>({
    queryKey: classSubjectsQueryKeys.list(params),
    queryFn: () => getClassSubjects(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
