import { useMutation } from "@tanstack/react-query";
import { logoutFn } from "@/lib/services/api/auth/api.server";
import { useAuthStore } from "@/stores/auth.store";

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: () => logoutFn(),
    onSettled: () => {
      clearSession();
    },
  });
}
