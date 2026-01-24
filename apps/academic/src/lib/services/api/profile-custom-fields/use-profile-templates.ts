import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { listProfileTemplates } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { ProfileTemplatesResponse } from "./profile-custom-fields.types";

type UseProfileTemplatesOptions = {
  enabled?: boolean;
};

export function useProfileTemplates(options: UseProfileTemplatesOptions = {}) {
  return useQuery<ProfileTemplatesResponse>({
    queryKey: profileCustomFieldsKeys.templates(),
    queryFn: () => listProfileTemplates(),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}

export function useSuspenseProfileTemplates() {
  return useSuspenseQuery<ProfileTemplatesResponse>({
    queryKey: profileCustomFieldsKeys.templates(),
    queryFn: () => listProfileTemplates(),
  });
}
