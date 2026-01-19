import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateStudentProfile } from "./api.client";
import { studentsQueryKeys } from "./students.keys";
import type { UpdateStudentProfileVars } from "./students.types";

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateStudentProfileVars) =>
      updateStudentProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsQueryKeys.lists() });
    },
  });
}
