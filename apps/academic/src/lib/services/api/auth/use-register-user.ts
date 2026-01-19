import { useMutation } from "@tanstack/react-query";

import { registerUser } from "./api.client";
import type { RegisterVars } from "./auth.types";

export function useRegisterUser() {
  return useMutation({
    mutationFn: (payload: RegisterVars) => registerUser(payload),
  });
}
