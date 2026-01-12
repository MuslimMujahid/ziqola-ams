import { useMutation } from "@tanstack/react-query";
import { loginFn } from "@/lib/services/api/auth/api.server";
import type { LoginVars } from "@/lib/services/api/auth";
import { useAuthStore } from "@/stores/auth.store";
import { authQueryKeys } from "@/lib/services/api/auth/auth.keys";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginVars) => loginFn({ data: payload }),
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
