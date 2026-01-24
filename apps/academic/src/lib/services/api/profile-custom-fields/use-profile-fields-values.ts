import { useQuery } from "@tanstack/react-query";

import { getProfileFieldsAndValues } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type {
  ProfileFieldsValuesResponse,
  ProfileRole,
} from "./profile-custom-fields.types";

type UseProfileFieldsValuesOptions = {
  enabled?: boolean;
};

export function useProfileFieldsValues(
  tenantId: string,
  role: ProfileRole,
  profileId: string,
  options: UseProfileFieldsValuesOptions = {},
) {
  return useQuery<ProfileFieldsValuesResponse>({
    queryKey: profileCustomFieldsKeys.profileValues(tenantId, role, profileId),
    queryFn: () => getProfileFieldsAndValues(tenantId, role, profileId),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
