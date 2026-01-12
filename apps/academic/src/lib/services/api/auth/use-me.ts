import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserFn } from "@/lib/services/api/auth/api.server";
import { useAuthStore } from "@/stores/auth.store";
import { authQueryKeys } from "@/lib/services/api/auth/auth.keys";

type UseMeOptions = {
  enabled?: boolean;
};

export function useMe(options: UseMeOptions = {}) {
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: () => getCurrentUserFn(),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60 * 2,
  });

  React.useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data ?? null);
    }
  }, [query.data, query.isSuccess, setUser]);

  return query;
}
