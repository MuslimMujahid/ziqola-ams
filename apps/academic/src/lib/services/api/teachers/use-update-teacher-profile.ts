import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTeacherProfile } from "./api.client";
import { teacherQueryKeys } from "./teachers.keys";
import type { UpdateTeacherProfileVars } from "./teachers.types";

export function useUpdateTeacherProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTeacherProfileVars) =>
      updateTeacherProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
    },
  });
}
