import { useMutation } from "@tanstack/react-query";
import { registerTenantFn } from "@/lib/services/api/tenant/api.server";
import type {
  RegisterTenantSessionResult,
  RegisterTenantVars,
} from "@/lib/services/api/tenant/tenant.types";
import { useAuthStore } from "@/stores/auth.store";
import { authQueryKeys } from "@/lib/services/api/auth/auth.keys";

export function useRegisterTenant() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<RegisterTenantSessionResult, Error, RegisterTenantVars>({
    mutationFn: (payload: RegisterTenantVars) =>
      registerTenantFn({ data: payload }),
    onSuccess: (response) => {
      setSession({
        user: response.user,
        tokens: { accessToken: response.accessToken },
      });
    },
    meta: {
      invalidateQueries: [authQueryKeys.me()],
    },
  });
}
