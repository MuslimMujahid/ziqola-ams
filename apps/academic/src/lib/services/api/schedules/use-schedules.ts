import { useQuery } from "@tanstack/react-query";

import { getSchedules } from "./api.client";
import { schedulesQueryKeys } from "./schedules.keys";
import type { GetSchedulesResponse, GetSchedulesVars } from "./schedules.types";

export function useSchedules(
  params: GetSchedulesVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetSchedulesResponse>({
    queryKey: schedulesQueryKeys.list(params),
    queryFn: () => getSchedules(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
