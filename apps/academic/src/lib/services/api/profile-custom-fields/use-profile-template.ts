import { useQuery } from "@tanstack/react-query";

import { getProfileTemplate } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { ProfileTemplateResponse } from "./profile-custom-fields.types";

type UseProfileTemplateOptions = {
  enabled?: boolean;
};

export function useProfileTemplate(
  templateId: string,
  options: UseProfileTemplateOptions = {},
) {
  return useQuery<ProfileTemplateResponse>({
    queryKey: profileCustomFieldsKeys.templateDetail(templateId),
    queryFn: () => getProfileTemplate(templateId),
    enabled: (options.enabled ?? true) && Boolean(templateId),
    placeholderData: (previous) => previous,
  });
}
