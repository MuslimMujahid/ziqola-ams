import { useQuery } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { getAcademicPeriods } from "./api.client";
import type {
  GetAcademicPeriodsResponse,
  GetAcademicPeriodsVars,
} from "./academic.types";

export function useAcademicPeriods(
  params: GetAcademicPeriodsVars,
  options?: { enabled?: boolean },
) {
  return useQuery<GetAcademicPeriodsResponse>({
    queryKey: academicQueryKeys.periods(params),
    queryFn: () => getAcademicPeriods(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });
}
