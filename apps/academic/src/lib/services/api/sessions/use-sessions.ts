import { useQuery } from "@tanstack/react-query";

import { getSessions } from "./api.client";
import { sessionsQueryKeys } from "./sessions.keys";
import type { GetSessionsResponse, GetSessionsVars } from "./sessions.types";

export function useSessions(
  params: GetSessionsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetSessionsResponse>({
    queryKey: sessionsQueryKeys.list(params),
    queryFn: () => getSessions(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
