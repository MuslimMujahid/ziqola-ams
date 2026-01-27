import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAssessmentComponent } from "./api.client";
import { assessmentComponentsQueryKeys } from "./assessment-components.keys";
import type { UpdateAssessmentComponentVars } from "./assessment-components.types";

export function useUpdateAssessmentComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAssessmentComponentVars) =>
      updateAssessmentComponent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: assessmentComponentsQueryKeys.lists(),
      });
    },
  });
}
