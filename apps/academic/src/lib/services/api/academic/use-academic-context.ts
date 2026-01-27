import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { academicQueryKeys } from "./academic.keys";
import { getAcademicContext } from "./api.client";

export function useAcademicContext(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: academicQueryKeys.context(),
    queryFn: () => getAcademicContext(),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useSuspenseAcademicContext() {
  return useSuspenseQuery({
    queryKey: academicQueryKeys.context(),
    queryFn: () => getAcademicContext(),
    staleTime: 60_000,
  });
}
