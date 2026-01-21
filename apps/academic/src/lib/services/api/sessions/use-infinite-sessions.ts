import { useInfiniteQuery } from "@tanstack/react-query";

import { getSessions } from "./api.client";
import { sessionsQueryKeys } from "./sessions.keys";
import type {
  GetSessionsFilters,
  GetSessionsResponse,
  GetSessionsVars,
} from "./sessions.types";

type UseInfiniteSessionsOptions = {
  enabled?: boolean;
  pageSize?: number;
};

function getSessionsFilters(params: GetSessionsVars): GetSessionsFilters {
  const { offset: _offset, limit: _limit, ...filters } = params;
  return filters;
}

export function useInfiniteSessions(
  params: GetSessionsVars,
  options?: UseInfiniteSessionsOptions,
) {
  const pageSize = options?.pageSize ?? 20;
  const filters = getSessionsFilters(params);

  return useInfiniteQuery<GetSessionsResponse>({
    queryKey: sessionsQueryKeys.listInfinite(filters),
    queryFn: ({ pageParam }) =>
      getSessions({
        ...filters,
        offset: typeof pageParam === "number" ? pageParam : 0,
        limit: pageSize,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.meta.offset + lastPage.meta.limit;
      return nextOffset < lastPage.meta.total ? nextOffset : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const prevOffset = firstPage.meta.offset - firstPage.meta.limit;
      return prevOffset >= 0 ? prevOffset : undefined;
    },
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
