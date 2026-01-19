import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createEnrollment } from "./api.client";
import type { CreateEnrollmentVars } from "./enrollments.types";
import { studentsQueryKeys } from "@/lib/services/api/students";

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEnrollmentVars) => createEnrollment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() });
    },
  });
}
