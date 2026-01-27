import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAssessmentComponent } from "./api.client";
import { assessmentComponentsQueryKeys } from "./assessment-components.keys";
import type { DeleteAssessmentComponentVars } from "./assessment-components.types";

export function useDeleteAssessmentComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteAssessmentComponentVars) =>
      deleteAssessmentComponent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: assessmentComponentsQueryKeys.lists(),
      });
    },
  });
}
