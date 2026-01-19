import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteGroup } from "./api.client";
import { groupsQueryKeys } from "./groups.keys";
import type { DeleteGroupVars } from "./groups.types";

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteGroupVars) => deleteGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
    },
  });
}
