import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTeacherProfile } from "./api.client";
import { teacherQueryKeys } from "./teachers.keys";
import type { CreateTeacherProfileVars } from "./teachers.types";

export function useCreateTeacherProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTeacherProfileVars) =>
      createTeacherProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherQueryKeys.lists() });
    },
  });
}
