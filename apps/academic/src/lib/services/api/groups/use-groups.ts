import { useQuery } from "@tanstack/react-query";

import { groupsQueryKeys } from "./groups.keys";
import { getGroups } from "./api.client";
import type { GetGroupsResponse, GetGroupsVars } from "./groups.types";

export function useGroups(
  params: GetGroupsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetGroupsResponse>({
    queryKey: groupsQueryKeys.list(params),
    queryFn: () => getGroups(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
