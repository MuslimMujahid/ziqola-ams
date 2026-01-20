import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSchedule } from "./api.client";
import { schedulesQueryKeys } from "./schedules.keys";
import type { UpdateScheduleVars } from "./schedules.types";

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateScheduleVars) => updateSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: schedulesQueryKeys.lists(),
      });
    },
  });
}
