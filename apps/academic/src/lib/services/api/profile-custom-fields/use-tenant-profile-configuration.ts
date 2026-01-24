import { useQuery } from "@tanstack/react-query";

import { getTenantProfileConfiguration } from "./api.client";
import { profileCustomFieldsKeys } from "./profile-custom-fields.keys";
import type { TenantProfileConfigurationResponse } from "./profile-custom-fields.types";

type UseTenantProfileConfigurationOptions = {
  enabled?: boolean;
};

export function useTenantProfileConfiguration(
  tenantId: string,
  options: UseTenantProfileConfigurationOptions = {},
) {
  return useQuery<TenantProfileConfigurationResponse>({
    queryKey: profileCustomFieldsKeys.tenantConfiguration(tenantId),
    queryFn: () => getTenantProfileConfiguration(tenantId),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  });
}
