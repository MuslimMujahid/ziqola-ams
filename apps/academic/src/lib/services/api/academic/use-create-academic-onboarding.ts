import { useMutation, useQueryClient } from "@tanstack/react-query";
import { academicQueryKeys } from "./academic.keys";
import { createAcademicOnboarding } from "./api.client";
import type { CreateAcademicOnboardingVars } from "./academic.types";

export function useCreateAcademicOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAcademicOnboardingVars) =>
      createAcademicOnboarding(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicQueryKeys.context() });
    },
  });
}
