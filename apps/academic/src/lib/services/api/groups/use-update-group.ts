import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateGroup } from "./api.client";
import { groupsQueryKeys } from "./groups.keys";
import type { UpdateGroupVars } from "./groups.types";

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroupVars) => updateGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
    },
  });
}
