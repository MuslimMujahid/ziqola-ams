import { useQuery } from "@tanstack/react-query";
import { checkEmailAvailability } from "@/lib/services/api/tenant/api.client";
import { tenantQueryKeys } from "@/lib/services/api/tenant/tenant.keys";

export function useCheckEmailAvailability(
  email: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: tenantQueryKeys.emailAvailability(email),
    queryFn: () => checkEmailAvailability(email),
    enabled: options?.enabled ?? false,
    staleTime: 30_000,
  });
}
