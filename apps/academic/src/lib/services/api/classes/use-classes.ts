import { useQuery } from "@tanstack/react-query";

import { classesQueryKeys } from "./classes.keys";
import { getClasses } from "./api.client";
import type { GetClassesResponse, GetClassesVars } from "./classes.types";

export function useClasses(
  params: GetClassesVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetClassesResponse>({
    queryKey: classesQueryKeys.list(params),
    queryFn: () => getClasses(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
