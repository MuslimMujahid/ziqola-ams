import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteSchedule } from "./api.client";
import { schedulesQueryKeys } from "./schedules.keys";
import type { DeleteScheduleVars } from "./schedules.types";

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteScheduleVars) => deleteSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: schedulesQueryKeys.lists(),
      });
    },
  });
}
