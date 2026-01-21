import { useQuery } from "@tanstack/react-query";

import { getSessionById } from "./api.client";
import { sessionsQueryKeys } from "./sessions.keys";
import type { SessionItem } from "./sessions.types";

type UseSessionDetailOptions = {
  enabled?: boolean;
};

export function useSessionDetail(
  sessionId: string,
  options?: UseSessionDetailOptions,
) {
  return useQuery<SessionItem>({
    queryKey: sessionsQueryKeys.detail(sessionId),
    queryFn: () => getSessionById(sessionId),
    enabled: options?.enabled ?? Boolean(sessionId),
  });
}
