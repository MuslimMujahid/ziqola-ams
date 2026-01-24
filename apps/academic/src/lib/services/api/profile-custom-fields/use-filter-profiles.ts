import { useQuery } from "@tanstack/react-query";

import { filterProfiles } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type {
  FilterProfilesResponse,
  FilterProfilesVars,
} from "./profile-custom-fields.types";

type UseFilterProfilesOptions = {
  enabled?: boolean;
};

export function useFilterProfiles<TProfile>(
  vars: FilterProfilesVars,
  filtersKey: string,
  options: UseFilterProfilesOptions = {},
) {
  return useQuery<FilterProfilesResponse<TProfile>>({
    queryKey: profileCustomFieldsKeys.filteredProfiles(
      vars.tenantId,
      vars.role,
      filtersKey,
    ),
    queryFn: () => filterProfiles<TProfile>(vars),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
