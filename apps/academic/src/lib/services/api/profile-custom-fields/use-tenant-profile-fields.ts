import { useQuery } from "@tanstack/react-query";

import { listTenantProfileFields } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type {
  ProfileFieldsResponse,
  ProfileRole,
} from "./profile-custom-fields.types";

type UseTenantProfileFieldsOptions = {
  enabled?: boolean;
};

export function useTenantProfileFields(
  tenantId: string,
  role: ProfileRole,
  options: UseTenantProfileFieldsOptions = {},
) {
  return useQuery<ProfileFieldsResponse>({
    queryKey: profileCustomFieldsKeys.tenantFields(tenantId, role),
    queryFn: () => listTenantProfileFields(tenantId, role),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
