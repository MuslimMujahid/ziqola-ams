import { useQuery } from "@tanstack/react-query";
import { checkSchoolCodeAvailability } from "@/lib/services/api/tenant/api.client";
import { tenantQueryKeys } from "@/lib/services/api/tenant/tenant.keys";

export function useCheckSchoolCodeAvailability(
  schoolCode: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: tenantQueryKeys.availability(schoolCode),
    queryFn: () => checkSchoolCodeAvailability(schoolCode),
    enabled: options?.enabled ?? false,
    staleTime: 30_000,
  });
}
