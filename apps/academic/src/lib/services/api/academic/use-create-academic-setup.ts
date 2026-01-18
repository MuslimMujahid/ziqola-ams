import { useMutation, useQueryClient } from "@tanstack/react-query";
import { academicQueryKeys } from "./academic.keys";
import { createAcademicSetup } from "./api.client";
import type { CreateAcademicSetupVars } from "./academic.types";

export function useCreateAcademicSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicSetupVars) =>
      createAcademicSetup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.context() });
    },
  });
}
