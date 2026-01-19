import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createGroup } from "./api.client";
import { groupsQueryKeys } from "./groups.keys";
import type { CreateGroupVars } from "./groups.types";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupVars) => createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
    },
  });
}
