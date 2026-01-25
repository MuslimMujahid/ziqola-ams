import { useMutation } from "@tanstack/react-query";
import { acceptInvite } from "@/lib/services/api/auth/api.client";
import type { AcceptInviteVars } from "@/lib/services/api/auth";

export function useAcceptInvite() {
  return useMutation({
    mutationFn: (payload: AcceptInviteVars) => acceptInvite(payload),
  });
}
