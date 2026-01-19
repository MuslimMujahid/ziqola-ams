import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createStudentProfile } from "./api.client";
import { studentsQueryKeys } from "./students.keys";
import type { CreateStudentProfileVars } from "./students.types";

export function useCreateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStudentProfileVars) =>
      createStudentProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() });
    },
  });
}
