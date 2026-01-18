import { useQuery } from "@tanstack/react-query";

import { academicQueryKeys } from "./academic.keys";
import { getAcademicYears } from "./api.client";
import type {
  GetAcademicYearsResponse,
  GetAcademicYearsVars,
} from "./academic.types";

export function useAcademicYears(params: GetAcademicYearsVars) {
  return useQuery<GetAcademicYearsResponse>({
    queryKey: academicQueryKeys.years(params),
    queryFn: () => getAcademicYears(params),
    placeholderData: (previous) => previous,
  });
}
