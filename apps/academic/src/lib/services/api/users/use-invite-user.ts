import { useMutation } from "@tanstack/react-query";

import { inviteUser } from "./api.client";
import type { InviteUserVars } from "./users.types";

export function useInviteUser() {
  return useMutation({
    mutationFn: (payload: InviteUserVars) => inviteUser(payload),
  });
}
