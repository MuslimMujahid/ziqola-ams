import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSchedule } from "./api.client";
import { schedulesQueryKeys } from "./schedules.keys";
import type { CreateScheduleVars } from "./schedules.types";

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateScheduleVars) => createSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: schedulesQueryKeys.lists(),
      });
    },
  });
}
